const fs = require('fs');
let content = fs.readFileSync('src/components/Vault/PasswordVaultView.tsx', 'utf8');

const search = `              </motion.div>
            );
          })
        )}
      </div>`;
          
const replace = `              </motion.div>
            );
          })}
          </AnimatePresence>
        )}
      </div>`;

if (content.includes(search)) {
  content = content.replace(search, replace);
  fs.writeFileSync('src/components/Vault/PasswordVaultView.tsx', content);
  console.log("Replaced bottom part!");
} else {
  console.log("Could not find bottom part!");
}
