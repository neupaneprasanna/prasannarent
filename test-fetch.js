async function fetchProfile() {
    try {
        const fetch = (await import('node-fetch')).default;
        const res = await fetch("http://127.0.0.1:5000/api/engagement/profile/cmn6yr0c90000llgrvtzkxyd2/full");
        console.log(res.status);
        console.log(await res.text());
    } catch (err) {
        console.error("fetch failed", err);
    }
}
fetchProfile();
