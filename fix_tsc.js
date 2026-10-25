const fs = require('fs');

let brandContent = fs.readFileSync('src/components/Branding/InteractiveBrand.tsx', 'utf-8');
brandContent = brandContent.replace(/import { motion, Variants } from 'framer-motion';/g, "import { motion } from 'framer-motion';");
brandContent = brandContent.replace(/Variants/g, "any");
fs.writeFileSync('src/components/Branding/InteractiveBrand.tsx', brandContent);

let keyContent = fs.readFileSync('src/components/LobsterKeys/LobsterKeyWizard.tsx', 'utf-8');
keyContent = keyContent.replace(/res\.data\.key/g, "(res.data as any).key");
keyContent = keyContent.replace(/res\.data\.apiKey/g, "(res.data as any).apiKey");
keyContent = keyContent.replace(/res\.data\.api_key/g, "(res.data as any).api_key");
fs.writeFileSync('src/components/LobsterKeys/LobsterKeyWizard.tsx', keyContent);

let importContent = fs.readFileSync('src/components/Settings/ImportExportView.tsx', 'utf-8');
importContent = importContent.replace(/results\.stage1\.format/g, "(results.stage1 as any).format");
fs.writeFileSync('src/components/Settings/ImportExportView.tsx', importContent);
