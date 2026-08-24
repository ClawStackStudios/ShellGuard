const fs = require('fs');
let content = fs.readFileSync('src/components/Vault/PasswordVaultView.tsx', 'utf8');

const search = `                    {/* Quick Copy Secret Button */}
                    <button
                      type="button"
                      onClick={() => handleCopy(item.secret, item.id, "secret_quick_copy")}
                      className="p-2 text-slate-400 hover:text-claw-cyan hover:bg-cyan-50 dark:hover:bg-cyan-950/30 rounded-xl transition-colors cursor-pointer"
                      title="Quick Copy Secret"
                    >
                      {copyFeedback?.id === item.id && copyFeedback.field === "secret_quick_copy" ? (
                        <Check size={16} className="text-green-500" />
                      ) : (
                        <Copy size={16} />
                      )}
                    </button>`;
          
const replace = `                    {/* Quick Actions Dropdown */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setQuickActionOpenId(quickActionOpenId === item.id ? null : item.id);
                        }}
                        className="p-2 text-slate-400 hover:text-claw-cyan hover:bg-cyan-50 dark:hover:bg-cyan-950/30 rounded-xl transition-colors cursor-pointer"
                        title="Quick Actions"
                      >
                        <Zap size={16} />
                      </button>
                      
                      <AnimatePresence>
                        {quickActionOpenId === item.id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 5 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 5 }}
                            transition={{ duration: 0.15 }}
                            className="absolute right-0 top-full mt-1 w-44 bg-theme-surface border border-theme-subtle rounded-xl shadow-lg shadow-black/10 z-50 overflow-hidden flex flex-col py-1"
                          >
                            <button
                              onClick={(e) => { e.stopPropagation(); handleCopy(item.username || "", item.id, "username_quick_copy"); setQuickActionOpenId(null); }}
                              className="px-3 py-2 text-xs text-left hover:bg-slate-50 dark:hover:bg-slate-800 text-theme-main flex items-center justify-between transition-colors disabled:opacity-50"
                              disabled={!item.username}
                            >
                              <span>Copy Username</span>
                              {copyFeedback?.id === item.id && copyFeedback.field === "username_quick_copy" ? <Check size={14} className="text-green-500" /> : <Copy size={14} className="text-slate-400" />}
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleCopy(item.secret, item.id, "secret_quick_copy"); setQuickActionOpenId(null); }}
                              className="px-3 py-2 text-xs text-left hover:bg-slate-50 dark:hover:bg-slate-800 text-theme-main flex items-center justify-between transition-colors"
                            >
                              <span>Copy {activeTypeTab === "password" ? "Password" : "Secret"}</span>
                              {copyFeedback?.id === item.id && copyFeedback.field === "secret_quick_copy" ? <Check size={14} className="text-green-500" /> : <Copy size={14} className="text-slate-400" />}
                            </button>
                            {item.url && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleCopy(item.url, item.id, "url_quick_copy"); setQuickActionOpenId(null); }}
                                className="px-3 py-2 text-xs text-left hover:bg-slate-50 dark:hover:bg-slate-800 text-theme-main flex items-center justify-between transition-colors"
                              >
                                <span>Copy URL</span>
                                {copyFeedback?.id === item.id && copyFeedback.field === "url_quick_copy" ? <Check size={14} className="text-green-500" /> : <Copy size={14} className="text-slate-400" />}
                              </button>
                            )}
                            {item.totp_secret && (
                              <button
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  const token = new OTPAuth.TOTP({ secret: item.totp_secret }).generate();
                                  handleCopy(token, item.id, "totp_quick_copy"); 
                                  setQuickActionOpenId(null); 
                                }}
                                className="px-3 py-2 text-xs text-left hover:bg-slate-50 dark:hover:bg-slate-800 text-theme-main flex items-center justify-between transition-colors"
                              >
                                <span>Copy 2FA Code</span>
                                {copyFeedback?.id === item.id && copyFeedback.field === "totp_quick_copy" ? <Check size={14} className="text-green-500" /> : <Copy size={14} className="text-slate-400" />}
                              </button>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>`;

if (content.includes(search)) {
  content = content.replace(search, replace);
  fs.writeFileSync('src/components/Vault/PasswordVaultView.tsx', content);
  console.log("Replaced quick actions!");
} else {
  console.log("Could not find quick actions!");
}
