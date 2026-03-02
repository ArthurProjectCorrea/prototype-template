/**
 * Supabase Database Utility Library
 *
 * Provides CRUD operations against Supabase database.
 * Compatible interface with lib/db.js (JSON version)
 */

import { createClient } from './supabase/server';

// ============================================
// Response Formatting
// ============================================

export function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function errorResponse(message, status = 400) {
  return jsonResponse({ error: message }, status);
}

// ============================================
// Query Parsing
// ============================================

export function parseQueryParams(req) {
  const { searchParams } = new URL(req.url);
  const params = {};

  for (const [key, value] of searchParams.entries()) {
    if (value === 'true') params[key] = true;
    else if (value === 'false') params[key] = false;
    else if (!isNaN(value)) params[key] = Number(value);
    else params[key] = value;
  }

  return params;
}

// ============================================
// CRUD Operations
// ============================================

/**
 * Get all records from a table
 */
export async function getAll(table, options = {}) {
  const supabase = await createClient();

  try {
    // Build select string first with includes if needed
    let selectStr = '*';
    if (options.include && options.relations) {
      selectStr = buildSelectString(table, options.include, options.relations);
    }

    let query = supabase.from(table).select(selectStr);

    // Apply filters
    if (options.where) {
      Object.entries(options.where).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          query = query.in(key, value);
        } else {
          query = query.eq(key, value);
        }
      });
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error(`Error reading from ${table}:`, error);
    throw error;
  }
}

/**
 * Get single record by ID
 */
export async function getById(table, id, options = {}) {
  const supabase = await createClient();

  try {
    let query = supabase.from(table).select('*').eq('id', id).single();

    // Include relations
    if (options.include && options.relations) {
      const includeStr = buildSelectString(
        table,
        options.include,
        options.relations
      );
      query = supabase.from(table).select(includeStr).eq('id', id).single();
    }

    const { data, error } = await query;

    if (error && error.code === 'PGRST116') return null; // Not found
    if (error) throw error;
    return data || null;
  } catch (error) {
    console.error(`Error reading from ${table}:`, error);
    return null;
  }
}

/**
 * Create new record
 */
export async function create(table, data) {
  const supabase = await createClient();

  try {
    // Add timestamps
    const record = {
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: created, error } = await supabase
      .from(table)
      .insert([record])
      .select()
      .single();

    if (error) throw error;
    return created;
  } catch (error) {
    console.error(`Error creating in ${table}:`, error);
    throw error;
  }
}

/**
 * Update record
 */
export async function update(table, id, updates) {
  const supabase = await createClient();

  try {
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    const { data: updated, error } = await supabase
      .from(table)
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return updated;
  } catch (error) {
    console.error(`Error updating in ${table}:`, error);
    throw error;
  }
}

/**
 * Delete record
 */
export async function remove(table, id) {
  const supabase = await createClient();

  try {
    const { error } = await supabase.from(table).delete().eq('id', id);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error(`Error deleting from ${table}:`, error);
    throw error;
  }
}

/**
 * Batch operations
 */
export async function createMany(table, records) {
  const supabase = await createClient();

  try {
    const now = new Date().toISOString();
    const data = records.map((record) => ({
      ...record,
      created_at: now,
      updated_at: now,
    }));

    const { data: created, error } = await supabase
      .from(table)
      .insert(data)
      .select();

    if (error) throw error;
    return created || [];
  } catch (error) {
    console.error(`Error batch creating in ${table}:`, error);
    throw error;
  }
}

/**
 * Build select string for related data
 * Format: "*, relation(*), relation2(id, name)"
 */
function buildSelectString(table, includes, relations) {
  let select = '*';

  includes.forEach((include) => {
    const relation = relations[include];
    if (!relation) return;

    if (relation.type === 'one') {
      // One-to-many relation
      select += `, ${include}(*)`;
    } else if (relation.type === 'many') {
      // Many-to-one relation or array
      select += `, ${include}(*)`;
    } else if (relation.type === 'reverse') {
      // Reverse relation (select from related table where fk = id)
      select += `, ${include}(*)`;
    }
  });

  return select;
}
