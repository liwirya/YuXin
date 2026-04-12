/**
 * @param {string} spotifyUrl - URL Track Spotify
 * @returns {Promise<Object>} - Object berisi metadata dan link download
 */
async function Spotmate(spotifyUrl) {
    const baseUrl = 'https://spotmate.online';
    
    const defaultHeaders = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Origin': baseUrl,
        'Referer': `${baseUrl}/en1`
    };

    try {
        const initRes = await fetch(`${baseUrl}/en1`, { headers: defaultHeaders });
        const html = await initRes.text();

        let cookieString = '';
        if (typeof initRes.headers.getSetCookie === 'function') {
            const cookiesArray = initRes.headers.getSetCookie();
            cookieString = cookiesArray.map(cookie => cookie.split(';')[0]).join('; ');
        } else {
            const rawCookies = initRes.headers.get('set-cookie');
            if (rawCookies) {
                cookieString = rawCookies.split(',').map(c => c.split(';')[0]).join('; ');
            }
        }

        const csrfMatch = html.match(/<meta\s+name=["']csrf-token["']\s+content=["']([^"']+)["']/i);
        const csrfToken = csrfMatch ? csrfMatch[1] : null;

        if (!csrfToken || !cookieString) {
            throw new Error("Gagal mendapatkan Session Cookie atau CSRF Token dari website.");
        }

        const apiHeaders = {
            ...defaultHeaders,
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': csrfToken,
            'Cookie': cookieString
        };

        const trackRes = await fetch(`${baseUrl}/getTrackData`, {
            method: 'POST',
            headers: apiHeaders,
            body: JSON.stringify({ spotify_url: spotifyUrl })
        });
        
        if (!trackRes.ok) throw new Error(`HTTP Error dari getTrackData: ${trackRes.status}`);
        const trackData = await trackRes.json();

        const convertRes = await fetch(`${baseUrl}/convert`, {
            method: 'POST',
            headers: apiHeaders,
            body: JSON.stringify({ urls: spotifyUrl })
        });
        
        if (!convertRes.ok) throw new Error(`HTTP Error dari convert: ${convertRes.status}`);
        const convertData = await convertRes.json();

        if (convertData.error) {
            throw new Error(convertData.message || "Gagal mengkonversi track.");
        }

        return {
            success: true,
            data: {
                id: trackData.id,
                title: trackData.name,
                artist: trackData.artists ? trackData.artists.map(a => a.name).join(', ') : 'Unknown',
                duration_ms: trackData.duration_ms,
                thumbnail: trackData.album?.images?.[0]?.url || null,
                download_url: convertData.url
            }
        };

    } catch (error) {
        return {
            success: false,
            message: error.message
        };
    }
}

export default Spotmate;
