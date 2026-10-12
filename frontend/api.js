
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export async function apiFetch(path, options = {}) {
    let token = localStorage.getItem("token");

    // İlk isteği gönder
    let response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
            ...options.headers,
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        credentials: "include"
    });

    // Access token geçersizse yenilemeyi dene
    if (response.status !== 401 || !token) {
        return response;
    }

    const refreshResponse = await fetch(`${API_URL}/refresh`, {
        method: "POST",
        credentials: "include"
    });

    // Refresh başarısızsa oturum bilgilerini temizle
    if (!refreshResponse.ok) {
        localStorage.removeItem("token");
        localStorage.removeItem("username");
        localStorage.removeItem("ownId");

        window.location.href = "/signin";
        return response;
    }

    const refreshData = await refreshResponse.json();

    // Yeni access token'ı sakla
    token = refreshData.token;
    localStorage.setItem("token", token);

    // İlk isteği yeni token ile bir kez daha gönder
    return fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
            ...options.headers,
            Authorization: `Bearer ${token}`
        },
        credentials: "include"
    });
}

export default API_URL
