/**
 * HTML Comments Parser
 *
 * This script parses HTML content and extracts comment information including:
 * - Commenter's username
 * - Avatar image URL (from parameter)
 * - Comment content
 * - Comment timestamp
 */

/**
 * Parse HTML content and extract comments
 * @param {string} htmlContent - The HTML content to parse
 * @param {string} avatarUrl - The URL to use for all comment avatars
 * @returns {Array} - Array of comment objects
 */
function parseHtmlComments(htmlContent, avatarUrl) {
  // Create a temporary DOM element to parse the HTML
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');

  // Array to store all comment data
  const comments = [];

  try {
    // First try to extract from React app data if available
    const reactAppData = extractFromReactAppData(doc, avatarUrl);
    if (reactAppData.length > 0) {
      console.log('Found comments from React app data');
      return reactAppData;
    }

    // Find all comment containers
    // GitHub typically uses these selectors for comments
    const commentContainers = doc.querySelectorAll('.js-timeline-item');

    if (commentContainers.length === 0) {
      // Try alternative selectors if the first one doesn't work
      const alternativeContainers = doc.querySelectorAll('.js-comment-container');

      if (alternativeContainers.length === 0) {
        // If still no comments found, try a more general approach
        console.log('Using general approach to find comments');
        return extractCommentsGeneral(doc, avatarUrl);
      } else {
        console.log(`Found ${alternativeContainers.length} comments using alternative selector`);
        return processCommentContainers(alternativeContainers, avatarUrl);
      }
    } else {
      console.log(`Found ${commentContainers.length} comments`);
      return processCommentContainers(commentContainers, avatarUrl);
    }
  } catch (error) {
    console.error('Error extracting comments:', error);
    return [];
  }
}

/**
 * Extract from React app data embedded in the page
 * @param {Document} doc - The parsed HTML document
 * @param {string} avatarUrl - The URL to use for all comment avatars
 * @returns {Array} - Array of comment objects
 */
function extractFromReactAppData(doc, avatarUrl) {
  try {
    // Look for React app data in the page
    const reactAppElements = doc.querySelectorAll('script[data-target="react-app.embeddedData"]');
    const comments = [];

    for (const element of reactAppElements) {
      try {
        const data = JSON.parse(element.textContent);

        // Check if this is an issue page with the expected data structure
        if (data.payload && data.payload.preloadedQueries) {
          for (const query of data.payload.preloadedQueries) {
            if (query.queryName === "IssueIndexPageQuery" && query.result && query.result.data) {
              const repository = query.result.data.repository;

              if (repository && repository.search && repository.search.edges) {
                repository.search.edges.forEach(edge => {
                  if (edge.node && edge.node.__typename === "Issue") {
                    const issue = edge.node;

                    // Format the timestamp
                    let timestamp = issue.createdAt;
                    if (timestamp) {
                      const date = new Date(timestamp);
                      // Format as "Apr 11, 2025, 9:27 PM GMT+8"
                      timestamp = date.toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: 'numeric',
                        hour12: true,
                        timeZoneName: 'short'
                      });
                    }

                    comments.push({
                      index: issue.number,
                      title: issue.title,
                      username: issue.author ? issue.author.login : 'Unknown User',
                      avatarUrl: avatarUrl,
                      content: issue.titleHtml || issue.title,
                      timestamp: timestamp
                    });
                  }
                });
              }
            }
          }
        }
      } catch (err) {
        console.error('Error parsing React app data:', err);
      }
    }

    return comments;
  } catch (error) {
    console.error('Error in extractFromReactAppData:', error);
    return [];
  }
}

/**
 * Process comment containers to extract data
 * @param {NodeList} containers - The comment containers
 * @param {string} avatarUrl - The URL to use for all comment avatars
 * @returns {Array} - Array of comment objects
 */
function processCommentContainers(containers, avatarUrl) {
  const comments = [];

  containers.forEach((container, index) => {
    try {
      // Extract username
      const usernameElement = container.querySelector('.author') ||
                             container.querySelector('[class*="author"]') ||
                             container.querySelector('a[href*="/"]');

      // Extract comment content
      const commentBody = container.querySelector('.comment-body') ||
                         container.querySelector('[class*="comment-body"]') ||
                         container.querySelector('.markdown-body') ||
                         container.querySelector('[class*="content"]');

      // Extract timestamp
      const timestamp = container.querySelector('relative-time') ||
                       container.querySelector('time-ago') ||
                       container.querySelector('time') ||
                       container.querySelector('[datetime]');

      const comment = {
        index: index + 1,
        username: usernameElement ? usernameElement.textContent.trim() : 'Unknown User',
        avatarUrl: avatarUrl, // Use the provided avatarUrl
        content: commentBody ? commentBody.innerHTML : 'No content found',
        timestamp: timestamp ? (timestamp.getAttribute('datetime') || timestamp.textContent.trim()) : 'Unknown time'
      };

      comments.push(comment);
    } catch (err) {
      console.error(`Error processing comment ${index}:`, err);
    }
  });

  return comments;
}

/**
 * General approach when specific selectors don't work
 * @param {Document} doc - The parsed HTML document
 * @param {string} avatarUrl - The URL to use for all comment avatars
 * @returns {Array} - Array of comment objects
 */
function extractCommentsGeneral(doc, avatarUrl) {
  const comments = [];

  try {
    // Look for potential comment containers
    // This is a more general approach that looks for common patterns in GitHub issue pages

    // First try to find the issue timeline
    const timeline = doc.querySelector('.js-issues-timeline') ||
                    doc.querySelector('.js-discussion') ||
                    doc.querySelector('[data-gid="MDEwOlJlcG9zaXRvcnk="]');

    if (timeline) {
      // Look for comment-like elements within the timeline
      const potentialComments = timeline.querySelectorAll('div[id^="issue-"], div[id^="issuecomment-"], div[class*="comment"], div[class*="discussion"]');

      potentialComments.forEach((container, index) => {
        try {
          // Skip if this appears to be the issue itself (first comment) and we already have it
          if (index === 0 && comments.length > 0) return;

          // Extract username - look for author patterns
          let usernameElement = container.querySelector('a[class*="author"], span[class*="author"], a[href*="/"]');

          // If no username found, look for any link that might be a user profile
          if (!usernameElement) {
            const links = container.querySelectorAll('a');
            for (const link of links) {
              const href = link.getAttribute('href');
              if (href && href.match(/^\/[^\/]+$/) && !href.includes('tab=') && !href.includes('issues')) {
                usernameElement = link;
                break;
              }
            }
          }

          // Extract comment content - look for markdown or content areas
          const commentBody = container.querySelector('[class*="markdown"], [class*="content"], [class*="body"]');

          // Extract timestamp - look for time elements
          const timestamp = container.querySelector('time, [datetime], [class*="timestamp"], [class*="time"]');

          // Only add if we found at least some content
          if (commentBody || usernameElement) {
            const comment = {
              index: index + 1,
              username: usernameElement ? usernameElement.textContent.trim().replace(/[\n\r\s]+/g, ' ') : 'Unknown User',
              avatarUrl: avatarUrl, // Use the provided avatarUrl
              content: commentBody ? commentBody.innerHTML : 'No content found',
              timestamp: timestamp ? (timestamp.getAttribute('datetime') || timestamp.textContent.trim()) : 'Unknown time'
            };

            comments.push(comment);
          }
        } catch (err) {
          console.error(`Error processing potential comment ${index}:`, err);
        }
      });
    }

    // If we still don't have comments, try an even more general approach
    if (comments.length === 0) {
      // Look for any elements that might contain user-generated content
      const potentialComments = doc.querySelectorAll('div[class*="comment"], article, [class*="timeline-item"]');

      potentialComments.forEach((container, index) => {
        try {
          // Skip elements that are too small to be comments
          if (container.textContent.trim().length < 20) return;

          // Extract username from any element that might be an author
          const usernameElement = container.querySelector('a[href*="/"], [class*="user"], [class*="author"]');

          // Extract comment content from any element that might be content
          const commentBody = container.querySelector('[class*="body"], [class*="content"], p');

          // Extract timestamp from any element that might be a timestamp
          const timestamp = container.querySelector('time, [datetime], [class*="time"]');

          // Only add if we found at least some content
          if (commentBody && commentBody.textContent.trim().length > 20) {
            const comment = {
              index: index + 1,
              username: usernameElement ? usernameElement.textContent.trim().replace(/[\n\r\s]+/g, ' ') : 'Unknown User',
              avatarUrl: avatarUrl, // Use the provided avatarUrl
              content: commentBody.innerHTML,
              timestamp: timestamp ? (timestamp.getAttribute('datetime') || timestamp.textContent.trim()) : 'Unknown time'
            };

            comments.push(comment);
          }
        } catch (err) {
          console.error(`Error processing general comment ${index}:`, err);
        }
      });
    }
  } catch (error) {
    console.error('Error in extractCommentsGeneral:', error);
  }

  return comments;
}
export default parseHtmlComments;
// // Export the function for use in other scripts
// if (typeof module !== 'undefined' && module.exports) {
//   module.exports = { parseHtmlComments };
// } else {
//   // For browser usage
//   window.parseHtmlComments = parseHtmlComments;
// }
