export type Page = number | '...';

/**
 * Checks that the instance.currentPage property is within bounds for the current page range.
 * If not, return a correct value for currentPage, or the current value if OK.
 *
 * Copied from 'ngx-pagination' package
 */
export function outOfBoundCorrection(
  totalItems: number,
  itemsPerPage: number,
  currentPage: number,
): number {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  if (totalPages < currentPage && 0 < totalPages) {
    return totalPages;
  }

  if (currentPage < 1) {
    return 1;
  }

  return currentPage;
}

/**
 * Returns an array of Page objects to use in the pagination controls.
 *
 * Copied from 'ngx-pagination' package
 */
export function createPageArray(
  currentPage: number,
  itemsPerPage: number,
  totalItems: number,
  paginationRange: number,
): Page[] {
  // paginationRange could be a string if passed from attribute, so cast to number.
  paginationRange = +paginationRange;
  const pages: Page[] = [];

  // Return 1 as default page number
  // Make sense to show 1 instead of empty when there are no items
  const totalPages = Math.max(Math.ceil(totalItems / itemsPerPage), 1);
  const halfWay = Math.ceil(paginationRange / 2);

  const isStart = currentPage <= halfWay;
  const isEnd = totalPages - halfWay < currentPage;
  const isMiddle = !isStart && !isEnd;

  const ellipsesNeeded = paginationRange < totalPages;
  let i = 1;

  while (i <= totalPages && i <= paginationRange) {
    let label: number | '...';
    const pageNumber = calculatePageNumber(
      i,
      currentPage,
      paginationRange,
      totalPages,
    );
    const openingEllipsesNeeded = i === 2 && (isMiddle || isEnd);
    const closingEllipsesNeeded =
      i === paginationRange - 1 && (isMiddle || isStart);
    if (ellipsesNeeded && (openingEllipsesNeeded || closingEllipsesNeeded)) {
      label = '...';
    } else {
      label = pageNumber;
    }
    pages.push(label);
    i++;
  }

  return pages;
}

/**
 * Given the position in the sequence of pagination links [i],
 * figure out what page number corresponds to that position.
 *
 * Copied from 'ngx-pagination' package
 */
function calculatePageNumber(
  i: number,
  currentPage: number,
  paginationRange: number,
  totalPages: number,
) {
  const halfWay = Math.ceil(paginationRange / 2);
  if (i === paginationRange) {
    return totalPages;
  }

  if (i === 1) {
    return i;
  }

  if (paginationRange < totalPages) {
    if (totalPages - halfWay < currentPage) {
      return totalPages - paginationRange + i;
    }
    if (halfWay < currentPage) {
      return currentPage - halfWay + i;
    }
    return i;
  }

  return i;
}
