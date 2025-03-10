#/bin/bash

# Navigate to working directory where all github files are stored
cd /home/ec2-user/my-gym-manager

#Add npm and node to path
export NVM_BIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" #loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion" #loads nvm bash_completion

# Install node modules
npm install

# Start our node app in the background
npm start > app.out.log 2> app.err.log < /dev/null &