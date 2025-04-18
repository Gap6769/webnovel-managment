# Auto-switch to Node.js 18 when entering the project directory
if [ -f .nvmrc ]; then
  nvm use
fi 