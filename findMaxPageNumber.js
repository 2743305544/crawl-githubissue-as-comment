/**
 * Find Max Page Number
 *
 * This script finds the maximum page number from pagination elements.
 * It looks for the "Next" button and analyzes nearby pagination links
 * to determine the highest page number available.
 */

/**
 * Finds the maximum page number from pagination elements
 * @returns {number} The maximum page number found, or 1 if none found
 */
function findMaxPageNumber() {
  try {
    // Find the "Next" link element with the specific attributes mentioned
    const nextLink = document.querySelector('a[rel="next"][aria-label="Next Page"][class*="prc-Pagination-Page"]');

    if (!nextLink) {
      console.log('No "Next" pagination link found');
      return 1; // Default to 1 if no pagination is found
    }

    // Get all pagination links with the same class as the Next button
    const paginationClass = nextLink.className;
    const paginationLinks = document.querySelectorAll(`a[class="${paginationClass}"]`);

    // If we couldn't find links with exact class match, try a more flexible approach
    const allPaginationLinks = paginationLinks.length > 0 ?
                              paginationLinks :
                              document.querySelectorAll('a[class*="prc-Pagination-Page"]');

    if (allPaginationLinks.length === 0) {
      console.log('No pagination links found');
      return 1;
    }

    // Extract page numbers from the links
    const pageNumbers = [];
    for (const link of allPaginationLinks) {
      // Skip the "Next" link itself
      if (link.getAttribute('rel') === 'next') {
        continue;
      }

      // Extract the page number from href attribute (e.g., "#27" -> 27)
      const href = link.getAttribute('href');
      if (href && href.startsWith('#')) {
        const pageNum = parseInt(href.substring(1), 10);
        if (!isNaN(pageNum)) {
          pageNumbers.push(pageNum);
        }
      }
    }

    if (pageNumbers.length === 0) {
      console.log('No valid page numbers found in pagination links');
      return 1;
    }

    // Find the maximum page number
    const maxPageNumber = Math.max(...pageNumbers);
    console.log(`Maximum page number found: ${maxPageNumber}`);
    return maxPageNumber;
  } catch (error) {
    console.error('Error finding max page number:', error);
    return 1; // Default to 1 in case of error
  }
}

/**
 * Alternative implementation that specifically looks for the page link closest to the "Next" button
 * This matches the description where the closest link to Next was page 27
 * @returns {number} The maximum page number found, or 1 if none found
 */
function findMaxPageNumberByProximity() {
  try {
    // Find the "Next" link element
    const nextLink = document.querySelector('a[rel="next"][aria-label="Next Page"][class*="prc-Pagination-Page"]');

    if (!nextLink) {
      console.log('No "Next" pagination link found');
      return 1; // Default to 1 if no pagination is found
    }

    // Get all pagination links with the same class
    const paginationClass = nextLink.className;
    const allLinks = document.querySelectorAll(`a[class*="prc-Pagination-Page"]`);

    // Filter out the "Next" link itself
    const pageLinks = Array.from(allLinks).filter(link =>
      link.getAttribute('rel') !== 'next' &&
      link.getAttribute('aria-label') !== 'Next Page'
    );

    if (pageLinks.length === 0) {
      console.log('No page number links found');
      return 1;
    }

    // Extract page numbers and store with their DOM elements
    const pageNumberElements = [];
    for (const link of pageLinks) {
      const href = link.getAttribute('href');
      if (href && href.startsWith('#')) {
        const pageNum = parseInt(href.substring(1), 10);
        if (!isNaN(pageNum)) {
          pageNumberElements.push({ element: link, pageNumber: pageNum });
        }
      }
    }

    if (pageNumberElements.length === 0) {
      console.log('No valid page numbers found');
      return 1;
    }

    // Get the position of the "Next" button
    const nextRect = nextLink.getBoundingClientRect();

    // Find the page link closest to the "Next" button
    let closestLink = pageNumberElements[0];
    let minDistance = Number.MAX_VALUE;

    for (const item of pageNumberElements) {
      const rect = item.element.getBoundingClientRect();
      // Calculate distance between centers of elements
      const distance = Math.sqrt(
        Math.pow((rect.left + rect.width/2) - (nextRect.left + nextRect.width/2), 2) +
        Math.pow((rect.top + rect.height/2) - (nextRect.top + nextRect.height/2), 2)
      );

      if (distance < minDistance) {
        minDistance = distance;
        closestLink = item;
      }
    }

    console.log(`Closest page to Next button is: ${closestLink.pageNumber}`);
    return closestLink.pageNumber;
  } catch (error) {
    console.error('Error finding max page number by proximity:', error);
    return 1; // Default to 1 in case of error
  }
}

findMaxPageNumber();

