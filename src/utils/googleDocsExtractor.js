const axios = require('axios');

/**
 * Extract text content from Google Docs URL
 * @param {string} url - Google Docs URL
 * @returns {Promise<string>} - Extracted text content
 */
async function extractGoogleDocsContent(url) {
    try {
        // Convert Google Docs URL to export format
        let exportUrl = url;

        // Handle different Google Docs URL formats
        if (url.includes('/edit')) {
            // Remove any query parameters and replace /edit with /export
            exportUrl = url.split('?')[0].replace('/edit', '/export?format=txt');
        } else if (url.includes('/view')) {
            // Remove any query parameters and replace /view with /export
            exportUrl = url.split('?')[0].replace('/view', '/export?format=txt');
        } else if (!url.includes('/export')) {
            // If it's a basic Google Docs URL, remove query params and add export parameter
            exportUrl = url.split('?')[0] + (url.split('?')[0].endsWith('/') ? '' : '/') + 'export?format=txt';
        }



        const response = await axios.get(exportUrl, {
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        if (response.status === 200 && response.data) {
            const content = response.data.toString();
            return content;
        } else {

            // Try alternative method: Google Docs Viewer
            const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;

            try {
                const viewerResponse = await axios.get(viewerUrl, {
                    timeout: 15000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                    }
                });

                if (viewerResponse.status === 200) {
                    const html = viewerResponse.data;
                    // Extract text content from the viewer HTML
                    const textContent = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
                    if (textContent.length > 100) {
                        return textContent;
                    }
                }
            } catch (viewerError) {
                // Viewer method failed, continue to fallback
            }

            return null;
        }
    } catch (error) {
        console.error('Error extracting Google Docs content:', error.message);

        // Fallback: Try to get at least the document title
        try {
            const htmlResponse = await axios.get(url, {
                timeout: 10000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });

            if (htmlResponse.status === 200) {
                const html = htmlResponse.data;
                // Extract title from HTML
                const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
                if (titleMatch) {
                    return `Document Title: ${titleMatch[1]}\n\nNote: Full content extraction failed. This appears to be a Google Docs document.`;
                }
            }
        } catch (fallbackError) {
            console.error('Fallback extraction also failed:', fallbackError.message);
        }

        return null;
    }
}

/**
 * Check if URL is a Google Docs URL
 * @param {string} url - URL to check
 * @returns {boolean} - True if it's a Google Docs URL
 */
function isGoogleDocsUrl(url) {
    return url && (
        url.includes('docs.google.com') ||
        url.includes('drive.google.com') ||
        url.includes('google.com/docs')
    );
}

module.exports = {
    extractGoogleDocsContent,
    isGoogleDocsUrl
};
