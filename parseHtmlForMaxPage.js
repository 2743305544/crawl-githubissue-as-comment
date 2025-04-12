/**
 * Parse HTML for Max Page Number
 * 
 * This script takes HTML content as input and returns the maximum page number.
 * It uses the functions from findMaxPageNumber.js but works with HTML strings
 * instead of requiring DOM access.
 */

/**
 * Parses HTML content and returns the maximum page number
 * @param {string} htmlContent - The HTML content to parse
 * @returns {number} The maximum page number found, or 1 if none found
 */
function parseHtmlForMaxPage(htmlContent) {
  try {
    // Create a DOM parser
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    
    // Find the "Next" link element with the specific attributes mentioned
    const nextLink = doc.querySelector('a[rel="next"][aria-label="Next Page"][class*="prc-Pagination-Page"]');

    if (!nextLink) {
      console.log('No "Next" pagination link found');
      return 1; // Default to 1 if no pagination is found
    }

    // Get all pagination links with the same class as the Next button
    const paginationClass = nextLink.className;
    const paginationLinks = doc.querySelectorAll(`a[class="${paginationClass}"]`);

    // If we couldn't find links with exact class match, try a more flexible approach
    const allPaginationLinks = paginationLinks.length > 0 ?
                              paginationLinks :
                              doc.querySelectorAll('a[class*="prc-Pagination-Page"]');

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
    console.error('Error parsing HTML for max page number:', error);
    return 1; // Default to 1 in case of error
  }
}

/**
 * Alternative implementation that specifically looks for the page link closest to the "Next" button
 * This matches the description where the closest link to Next was page 27
 * @param {string} htmlContent - The HTML content to parse
 * @returns {number} The maximum page number found, or 1 if none found
 */
function parseHtmlForMaxPageByProximity(htmlContent) {
  try {
    // Create a DOM parser
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    
    // Find the "Next" link element
    const nextLink = doc.querySelector('a[rel="next"][aria-label="Next Page"][class*="prc-Pagination-Page"]');

    if (!nextLink) {
      console.log('No "Next" pagination link found');
      return 1; // Default to 1 if no pagination is found
    }

    // Get all pagination links with the same class
    const paginationClass = nextLink.className;
    const allLinks = doc.querySelectorAll(`a[class*="prc-Pagination-Page"]`);

    // Filter out the "Next" link itself
    const pageLinks = Array.from(allLinks).filter(link =>
      link.getAttribute('rel') !== 'next' &&
      link.getAttribute('aria-label') !== 'Next Page'
    );

    if (pageLinks.length === 0) {
      console.log('No page number links found');
      return 1;
    }

    // Extract page numbers from the links
    const pageNumbers = [];
    for (const link of pageLinks) {
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
      console.log('No valid page numbers found');
      return 1;
    }

    // Since we can't use getBoundingClientRect() with a parsed document,
    // we'll use a different approach - find the highest page number
    // which is a reasonable approximation in many pagination designs
    const maxPageNumber = Math.max(...pageNumbers);
    console.log(`Maximum page number found: ${maxPageNumber}`);
    return maxPageNumber;
  } catch (error) {
    console.error('Error parsing HTML for max page by proximity:', error);
    return 1; // Default to 1 in case of error
  }
}

/**
 * Node.js compatible function to parse HTML for max page number
 * @param {string} htmlContent - The HTML content to parse
 * @returns {number} The maximum page number found, or 1 if none found
 */
function parseHtmlForMaxPageNode(htmlContent) {
  try {
    // For Node.js environments, we need to use a different HTML parser
    // This function assumes you have jsdom installed
    const { JSDOM } = require('jsdom');
    const dom = new JSDOM(htmlContent);
    const doc = dom.window.document;
    
    // Find the "Next" link element with the specific attributes mentioned
    const nextLink = doc.querySelector('a[rel="next"][aria-label="Next Page"][class*="prc-Pagination-Page"]');

    if (!nextLink) {
      console.log('No "Next" pagination link found');
      return 1; // Default to 1 if no pagination is found
    }

    // Get all pagination links with the same class as the Next button
    const paginationClass = nextLink.className;
    const paginationLinks = doc.querySelectorAll(`a[class="${paginationClass}"]`);

    // If we couldn't find links with exact class match, try a more flexible approach
    const allPaginationLinks = paginationLinks.length > 0 ?
                              paginationLinks :
                              doc.querySelectorAll('a[class*="prc-Pagination-Page"]');

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
    console.error('Error parsing HTML for max page number (Node.js):', error);
    return 1; // Default to 1 in case of error
  }
}

// Example usage in browser:
// const maxPage = parseHtmlForMaxPage(htmlString);
// console.log(`The maximum page number is: ${maxPage}`);

// Export functions for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    parseHtmlForMaxPage,
    parseHtmlForMaxPageByProximity,
    parseHtmlForMaxPageNode
  };
} else if (typeof window !== 'undefined') {
  // Make functions available globally in browser environment
  window.parseHtmlForMaxPage = parseHtmlForMaxPage;
  window.parseHtmlForMaxPageByProximity = parseHtmlForMaxPageByProximity;
}
