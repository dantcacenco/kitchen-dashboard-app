# 1. First, save your code (just in case)
cp -r . ../kitchen-dashboard-backup

# 2. Delete the .git folder to remove all history
rm -rf .git

# 3. Create a proper .gitignore file FIRST
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
/.pnp
.pnp.js

# Testing
/coverage

# Next.js
/.next/
/out/

# Production
/build

# Misc
.DS_Store
*.pem

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Local env files
.env*.local
.env

# Vercel
.vercel

# TypeScript
*.tsbuildinfo
next-env.d.ts
EOF

# 4. Initialize a fresh Git repository
git init

# 5. Add all files (node_modules will be ignored now)
git add .

# 6. Create initial commit
git commit -m "Initial commit - Kitchen Dashboard App"

# 7. Add your GitHub repository as remote
git remote add origin https://github.com/dantcacenco/kitchen-dashboard-app.git

# 8. Push to GitHub (force push to overwrite)
git push -u origin main --force