const fs = require('fs');
const content = fs.readFileSync('src/App.tsx', 'utf8');
const search = `  // 🐚 Initial scuttle to check auth
  useEffect(() => {
    const token = sessionStorage.getItem("sg_api_token");
    const storedLobsterStr = localStorage.getItem("sg_lobster");
    
    if (token && storedLobsterStr) {
      const storedLobster = JSON.parse(storedLobsterStr);
      setLobster(storedLobster);
      if (!shellKey) {
        sessionStorage.removeItem("sg_api_token");
        localStorage.removeItem("sg_lobster");
        setLobster(null);
        setView("landing");
      } else {
        setView("vault");
        scuttleVault(shellKey);
        
        // Refresh user profile display name if available
        restAdapter.GET("/api/auth/me").then((profile: any) => {
          if (profile?.displayName) {
            const updated: Lobster = { ...storedLobster, displayName: profile.displayName };
            setLobster(updated);
            localStorage.setItem("sg_lobster", JSON.stringify(updated));
          }
        }).catch(() => {});
      }
    }
    setIsMolting(false);
  }, [shellKey]);`;

const replace = `  // 🐚 Initial scuttle to check auth
  useEffect(() => {
    const token = sessionStorage.getItem("sg_api_token");
    const storedLobsterStr = localStorage.getItem("sg_lobster");
    const rawKey = sessionStorage.getItem("sg_raw_key");
    
    if (token && storedLobsterStr && rawKey) {
      const storedLobster = JSON.parse(storedLobsterStr);
      setLobster(storedLobster);
      if (!shellKey) {
        deriveShellKey(rawKey, storedLobster.uuid).then((sk) => {
          setShellKey(sk);
          setView("vault");
        }).catch(() => {
          handleLogout();
        });
      } else {
        setView("vault");
        scuttleVault(shellKey);
        
        // Refresh user profile display name if available
        restAdapter.GET("/api/auth/me").then((profile: any) => {
          if (profile?.displayName) {
            const updated: Lobster = { ...storedLobster, displayName: profile.displayName };
            setLobster(updated);
            localStorage.setItem("sg_lobster", JSON.stringify(updated));
          }
        }).catch(() => {
          handleLogout();
        });
      }
    } else {
      if (token || storedLobsterStr || rawKey) {
        handleLogout();
      }
    }
    setIsMolting(false);
  }, [shellKey, handleLogout]);`;

if (content.includes(search)) {
  fs.writeFileSync('src/App.tsx', content.replace(search, replace));
  console.log("Successfully patched App.tsx auth logic!");
} else {
  console.log("Could not find the target code in App.tsx!");
}
