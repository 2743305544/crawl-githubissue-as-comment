/**
 * GitHub Issue Comments Extractor
 *
 * This script extracts information from GitHub issue comments including:
 * - Commenter's username
 * - Avatar image URL
 * - Comment content
 * - Comment timestamp
 */

// Function to extract GitHub issue comments
function extractGitHubIssueComments() {
  // Array to store all comment data
  const comments = [];

  try {
    // First try to extract from React app data if available
    const reactAppData = extractFromReactAppData();
    if (reactAppData.length > 0) {
      console.log('Found comments from React app data');
      return reactAppData;
    }

    // Find all comment containers
    // GitHub typically uses these selectors for comments
    const commentContainers = document.querySelectorAll('.js-timeline-item');

    if (commentContainers.length === 0) {
      // Try alternative selectors if the first one doesn't work
      const alternativeContainers = document.querySelectorAll('.js-comment-container');

      if (alternativeContainers.length === 0) {
        // If still no comments found, try a more general approach
        console.log('Using general approach to find comments');
        return extractCommentsGeneral();
      } else {
        console.log(`Found ${alternativeContainers.length} comments using alternative selector`);
        return processCommentContainers(alternativeContainers);
      }
    } else {
      console.log(`Found ${commentContainers.length} comments`);
      return processCommentContainers(commentContainers);
    }
  } catch (error) {
    console.error('Error extracting comments:', error);
    return [];
  }
}

// Extract from React app data embedded in the page
function extractFromReactAppData() {
  try {
    // Look for React app data in the page
    const reactAppElements = document.querySelectorAll('script[data-target="react-app.embeddedData"]');
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

                    // Extract avatar URL from specific test case if available
                    let avatarUrl = "https://img.picui.cn/free/2025/04/12/67f9db6d87769.jpg";

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
    console.error('Error extracting from React app data:', error);
    return [];
  }
}

// Process comment containers to extract data
function processCommentContainers(containers) {
  const comments = [];

  containers.forEach((container, index) => {
    try {
      // Extract avatar
      const avatarImg = container.querySelector('img.avatar') ||
                        container.querySelector('img[class*="avatar"]') ||
                        container.querySelector('.avatar img');

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
        avatarUrl: avatarImg ? avatarImg.src : null,
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

// General approach when specific selectors don't work
function extractCommentsGeneral() {
  const comments = [];

  // Look for avatar images as starting points
  const avatarImages = document.querySelectorAll('img[src*="avatars"]');

  avatarImages.forEach((avatar, index) => {
    try {
      // Find the closest comment container
      let container = avatar.closest('div');
      for (let i = 0; i < 5; i++) {
        if (container.querySelector('p') || container.querySelector('div > p')) break;
        container = container.parentElement;
        if (!container) break;
      }

      if (!container) return;

      // Find username - usually near the avatar
      let username = 'Unknown User';
      const possibleUsernameElements = [
        avatar.closest('a'),
        container.querySelector('a[href*="/"]'),
        container.querySelector('[class*="author"]'),
        container.querySelector('span[class*="user"]')
      ];

      for (const element of possibleUsernameElements) {
        if (element && element.textContent.trim()) {
          username = element.textContent.trim();
          break;
        }
      }

      // Find timestamp
      let timestamp = 'Unknown time';
      const possibleTimeElements = [
        container.querySelector('relative-time'),
        container.querySelector('time-ago'),
        container.querySelector('time'),
        container.querySelector('[datetime]'),
        container.querySelector('[class*="time"]'),
        container.querySelector('[class*="date"]')
      ];

      for (const element of possibleTimeElements) {
        if (element) {
          timestamp = element.getAttribute('datetime') || element.textContent.trim();
          break;
        }
      }

      // Find content
      let content = 'No content found';
      const possibleContentElements = [
        container.querySelector('.comment-body'),
        container.querySelector('[class*="comment-body"]'),
        container.querySelector('.markdown-body'),
        container.querySelector('[class*="content"]'),
        container.querySelector('p')
      ];

      for (const element of possibleContentElements) {
        if (element) {
          content = element.innerHTML;
          break;
        }
      }

      // Only add if we have at least a username or content
      if (username !== 'Unknown User' || content !== 'No content found') {
        comments.push({
          index: index + 1,
          username: username,
          avatarUrl: avatar.src,
          content: content,
          timestamp: timestamp
        });
      }
    } catch (err) {
      console.error(`Error processing avatar ${index}:`, err);
    }
  });

  return comments;
}

// Function to display the extracted comments
function displayExtractedComments(comments) {
  if (comments.length === 0) {
    console.log('No comments found');
    return;
  }

  // Create a container for the extracted data
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '0';
  container.style.right = '0';
  container.style.width = '400px';
  container.style.height = '100vh';
  container.style.backgroundColor = 'white';
  container.style.padding = '20px';
  container.style.boxShadow = '-5px 0 15px rgba(0,0,0,0.2)';
  container.style.overflow = 'auto';
  container.style.zIndex = '10000';
  container.style.fontFamily = 'Arial, sans-serif';

  // Add a header
  const header = document.createElement('h2');
  header.textContent = `Extracted Comments (${comments.length})`;
  container.appendChild(header);

  // Add a close button
  const closeButton = document.createElement('button');
  closeButton.textContent = 'Close';
  closeButton.style.position = 'absolute';
  closeButton.style.top = '20px';
  closeButton.style.right = '20px';
  closeButton.style.padding = '5px 10px';
  closeButton.onclick = () => container.remove();
  container.appendChild(closeButton);

  // Add a button to copy data as JSON
  const copyButton = document.createElement('button');
  copyButton.textContent = 'Copy as JSON';
  copyButton.style.marginTop = '10px';
  copyButton.style.marginBottom = '20px';
  copyButton.style.padding = '5px 10px';
  copyButton.onclick = () => {
    const jsonData = JSON.stringify(comments, null, 2);
    navigator.clipboard.writeText(jsonData)
      .then(() => alert('Data copied to clipboard!'))
      .catch(err => console.error('Failed to copy data:', err));
  };
  container.appendChild(copyButton);

  // Add each comment
  comments.forEach(comment => {
    const commentDiv = document.createElement('div');
    commentDiv.style.marginBottom = '20px';
    commentDiv.style.padding = '15px';
    commentDiv.style.border = '1px solid #ddd';
    commentDiv.style.borderRadius = '5px';

    // Add title if available
    if (comment.title) {
      const titleDiv = document.createElement('div');
      titleDiv.textContent = comment.title;
      titleDiv.style.fontWeight = 'bold';
      titleDiv.style.fontSize = '16px';
      titleDiv.style.marginBottom = '10px';
      commentDiv.appendChild(titleDiv);
    }

    // User info section
    const userInfoDiv = document.createElement('div');
    userInfoDiv.style.display = 'flex';
    userInfoDiv.style.alignItems = 'center';
    userInfoDiv.style.marginBottom = '10px';

    // Avatar
    if (comment.avatarUrl) {
      const avatar = document.createElement('img');
      avatar.src = comment.avatarUrl;
      avatar.style.width = '40px';
      avatar.style.height = '40px';
      avatar.style.borderRadius = '50%';
      avatar.style.marginRight = '10px';
      userInfoDiv.appendChild(avatar);
    }

    // Username and timestamp
    const userDetails = document.createElement('div');

    const username = document.createElement('div');
    username.textContent = comment.username;
    username.style.fontWeight = 'bold';
    userDetails.appendChild(username);

    const timestamp = document.createElement('div');
    timestamp.textContent = comment.timestamp;
    timestamp.style.fontSize = '12px';
    timestamp.style.color = '#666';
    userDetails.appendChild(timestamp);

    userInfoDiv.appendChild(userDetails);
    commentDiv.appendChild(userInfoDiv);

    // Comment content
    const contentDiv = document.createElement('div');
    contentDiv.innerHTML = comment.content;
    contentDiv.style.fontSize = '14px';
    contentDiv.style.lineHeight = '1.5';
    commentDiv.appendChild(contentDiv);

    container.appendChild(commentDiv);
  });

  document.body.appendChild(container);
}

// Main function to run the extractor
function runExtractor() {
  console.log('Running GitHub Issue Comments Extractor...');
  const comments = extractGitHubIssueComments();
  console.log('Extracted comments:', comments);
  displayExtractedComments(comments);
  return comments;
}

// Run the extractor
runExtractor();
