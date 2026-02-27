import * as React from 'react';

import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

/**
 * @typedef Route
 * @property {string} title - Visible text for the route
 * @property {string} [href] - URL for navigable routes; last item can omit it
 */

/**
 * @typedef PageHeaderProps
 * @property {Route[]} [routes]
 * @property {string} [title] - Main heading text shown above breadcrumb
 * @property {string} [description] - Optional subtitle/description below title
 */

/**
 * Page header with a breadcrumb trail, optional title and description.
 *
 * @param {PageHeaderProps} props
 */
export function PageHeader({ routes = [], title, description }) {
  return (
    <header className="space-y-0">
      <Breadcrumb className="text-sm p-2">
        <BreadcrumbList>
          {routes.map((route, idx) => {
            const isLast = idx === routes.length - 1;

            return (
              <React.Fragment key={route.title || idx}>
                <BreadcrumbItem>
                  {isLast ? (
                    <BreadcrumbPage>{route.title}</BreadcrumbPage>
                  ) : route.href ? (
                    <BreadcrumbLink href={route.href}>
                      {route.title}
                    </BreadcrumbLink>
                  ) : (
                    <span>{route.title}</span>
                  )}
                </BreadcrumbItem>
                {!isLast && <BreadcrumbSeparator />}
              </React.Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
      {/* <div className="space-y-2 p-2">
                {title && <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight text-balance">{title}</h1>}
                {description && <p className="leading-7 [&:not(:first-child)]:mt-6">{description}</p>}
            </div> */}
    </header>
  );
}
