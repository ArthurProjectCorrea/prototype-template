/**
 * Database Utility Library
 *
 * Centralized CRUD operations for JSON-based database.
 * All tables follow the standard: id, created_at, updated_at
 */

import fs from 'fs/promises';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'database');

// ============================================
// Core Database Functions
// ============================================

/**
 * Read data from a JSON table
 * @param {string} table - Table name (without .json extension)
 * @returns {Promise<Array>} Array of records
 */
export async function read(table) {
  const filePath = path.join(DB_PATH, `${table}.json`);
  const txt = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(txt);
}

/**
 * Write data to a JSON table (sorted by id)
 * @param {string} table - Table name (without .json extension)
 * @param {Array} data - Array of records to write
 */
export async function write(table, data) {
  const filePath = path.join(DB_PATH, `${table}.json`);
  data.sort((a, b) => (a.id || 0) - (b.id || 0));
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

/**
 * Get next available ID for a table
 * @param {Array} data - Current table data
 * @returns {number} Next available ID
 */
export function getNextId(data) {
  return data.length ? Math.max(...data.map((item) => item.id)) + 1 : 1;
}

/**
 * Get current timestamp in ISO format
 * @returns {string} ISO timestamp
 */
export function timestamp() {
  return new Date().toISOString();
}

// ============================================
// CRUD Operations
// ============================================

/**
 * Get all records from a table
 * @param {string} table - Table name
 * @param {Object} options - Query options
 * @param {Object} options.where - Filter conditions (key-value pairs)
 * @param {Array<string>} options.include - Related tables to include
 * @param {Object} options.relations - Relation definitions { fieldName: { table, foreignKey, type: 'one'|'many' } }
 * @returns {Promise<Array>} Filtered records with relations
 */
export async function getAll(table, options = {}) {
  let data = await read(table);

  // Apply filters
  if (options.where) {
    data = data.filter((item) => {
      return Object.entries(options.where).every(([key, value]) => {
        if (Array.isArray(value)) {
          return value.includes(item[key]);
        }
        return item[key] === value;
      });
    });
  }

  // Include relations
  if (options.include && options.relations) {
    data = await includeRelations(data, options.include, options.relations);
  }

  return data;
}

/**
 * Get single record by ID
 * @param {string} table - Table name
 * @param {number} id - Record ID
 * @param {Object} options - Query options (same as getAll)
 * @returns {Promise<Object|null>} Record or null if not found
 */
export async function getById(table, id, options = {}) {
  const data = await read(table);
  let record = data.find((item) => item.id === id);

  if (!record) return null;

  if (options.include && options.relations) {
    const [withRelations] = await includeRelations(
      [record],
      options.include,
      options.relations
    );
    record = withRelations;
  }

  return record;
}

/**
 * Create a new record
 * @param {string} table - Table name
 * @param {Object} record - Record data (without id, created_at, updated_at)
 * @returns {Promise<Object>} Created record with id and timestamps
 */
export async function create(table, record) {
  const data = await read(table);
  const now = timestamp();

  const newRecord = {
    id: getNextId(data),
    ...record,
    created_at: now,
    updated_at: now,
  };

  data.push(newRecord);
  await write(table, data);

  return newRecord;
}

/**
 * Update an existing record
 * @param {string} table - Table name
 * @param {number} id - Record ID to update
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object|null>} Updated record or null if not found
 */
export async function update(table, id, updates) {
  const data = await read(table);
  const idx = data.findIndex((item) => item.id === id);

  if (idx === -1) return null;

  const now = timestamp();
  data[idx] = {
    ...data[idx],
    ...updates,
    id: data[idx].id, // Prevent id modification
    created_at: data[idx].created_at, // Preserve original created_at
    updated_at: now,
  };

  await write(table, data);
  return data[idx];
}

/**
 * Delete a record by ID
 * @param {string} table - Table name
 * @param {number} id - Record ID to delete
 * @returns {Promise<boolean>} True if deleted, false if not found
 */
export async function remove(table, id) {
  const data = await read(table);
  const initialLength = data.length;
  const filtered = data.filter((item) => item.id !== id);

  if (filtered.length === initialLength) return false;

  await write(table, filtered);
  return true;
}

// ============================================
// Relation Helpers
// ============================================

/**
 * Include related data in records
 * @param {Array} records - Source records
 * @param {Array<string>} include - Fields to include
 * @param {Object} relations - Relation definitions
 * @returns {Promise<Array>} Records with included relations
 */
async function includeRelations(records, include, relations) {
  // Cache related tables to avoid multiple reads
  const cache = {};

  for (const field of include) {
    const relation = relations[field];
    if (!relation) continue;

    if (!cache[relation.table]) {
      cache[relation.table] = await read(relation.table);
    }
  }

  return records.map((record) => {
    const enriched = { ...record };

    for (const field of include) {
      const relation = relations[field];
      if (!relation) continue;

      const relatedData = cache[relation.table];
      const foreignKey = relation.foreignKey || `${field}_id`;
      const localValue = record[foreignKey];

      if (relation.type === 'one') {
        // One-to-one: find single related record
        enriched[field] = relatedData.find((r) => r.id === localValue) || null;
      } else if (relation.type === 'many') {
        // One-to-many: find all related records
        const ids = Array.isArray(localValue) ? localValue : [localValue];
        enriched[field] = relatedData.filter((r) => ids.includes(r.id));
      } else if (relation.type === 'reverse') {
        // Reverse relation: find records that reference this record
        const refKey = relation.referenceKey || `${table}_id`;
        enriched[field] = relatedData.filter((r) => {
          const refValue = r[refKey];
          return Array.isArray(refValue)
            ? refValue.includes(record.id)
            : refValue === record.id;
        });
      }
    }

    return enriched;
  });
}

/**
 * Check if a record is referenced by another table
 * @param {string} table - Related table to check
 * @param {string} field - Field in related table that references this record
 * @param {number} id - ID to check
 * @returns {Promise<boolean>} True if referenced
 */
export async function isReferenced(table, field, id) {
  const data = await read(table);
  return data.some((item) => {
    const value = item[field];
    return Array.isArray(value) ? value.includes(id) : value === id;
  });
}

/**
 * Get all records referencing a specific ID
 * @param {string} table - Table to search
 * @param {string} field - Field to check
 * @param {number} id - ID to find
 * @returns {Promise<Array>} Records that reference the ID
 */
export async function getReferences(table, field, id) {
  const data = await read(table);
  return data.filter((item) => {
    const value = item[field];
    return Array.isArray(value) ? value.includes(id) : value === id;
  });
}

// ============================================
// API Response Helpers
// ============================================

/**
 * Create a JSON response
 * @param {any} data - Response data
 * @param {number} status - HTTP status code
 * @returns {Response}
 */
export function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Create an error response
 * @param {string} message - Error message
 * @param {number} status - HTTP status code
 * @returns {Response}
 */
export function errorResponse(message, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Create a no-content response (204)
 * @returns {Response}
 */
export function noContentResponse() {
  return new Response(null, { status: 204 });
}

// ============================================
// Query Builders
// ============================================

/**
 * Parse query parameters from URL
 * @param {Request} req - Request object
 * @returns {Object} Parsed query parameters
 */
export function parseQueryParams(req) {
  const { searchParams } = new URL(req.url);
  const params = {};

  for (const [key, value] of searchParams.entries()) {
    // Handle numeric values
    if (/^\d+$/.test(value)) {
      params[key] = parseInt(value);
    }
    // Handle boolean values
    else if (value === 'true' || value === 'false') {
      params[key] = value === 'true';
    }
    // Handle comma-separated arrays
    else if (value.includes(',')) {
      params[key] = value.split(',').map((v) => {
        return /^\d+$/.test(v) ? parseInt(v) : v;
      });
    } else {
      params[key] = value;
    }
  }

  return params;
}

// ============================================
// Batch Operations
// ============================================

/**
 * Create multiple records at once
 * @param {string} table - Table name
 * @param {Array<Object>} records - Array of records to create
 * @returns {Promise<Array>} Created records
 */
export async function createMany(table, records) {
  const data = await read(table);
  let nextId = getNextId(data);
  const now = timestamp();

  const newRecords = records.map((record) => ({
    id: nextId++,
    ...record,
    created_at: now,
    updated_at: now,
  }));

  data.push(...newRecords);
  await write(table, data);

  return newRecords;
}

/**
 * Update multiple records matching criteria
 * @param {string} table - Table name
 * @param {Object} where - Filter conditions
 * @param {Object} updates - Fields to update
 * @returns {Promise<Array>} Updated records
 */
export async function updateMany(table, where, updates) {
  const data = await read(table);
  const now = timestamp();
  const updated = [];

  data.forEach((item, idx) => {
    const matches = Object.entries(where).every(([key, value]) => {
      if (Array.isArray(value)) return value.includes(item[key]);
      return item[key] === value;
    });

    if (matches) {
      data[idx] = {
        ...item,
        ...updates,
        id: item.id,
        created_at: item.created_at,
        updated_at: now,
      };
      updated.push(data[idx]);
    }
  });

  await write(table, data);
  return updated;
}

/**
 * Delete multiple records matching criteria
 * @param {string} table - Table name
 * @param {Object} where - Filter conditions
 * @returns {Promise<number>} Number of deleted records
 */
export async function removeMany(table, where) {
  const data = await read(table);
  const initialLength = data.length;

  const filtered = data.filter((item) => {
    return !Object.entries(where).every(([key, value]) => {
      if (Array.isArray(value)) return value.includes(item[key]);
      return item[key] === value;
    });
  });

  await write(table, filtered);
  return initialLength - filtered.length;
}
