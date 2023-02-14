# take default image of node boron i.e  node 6.x
FROM node:8.11.3

MAINTAINER christina <christinadivya.P@optisolbusiness.com>

RUN yarn global add gulp node-gyp pm2
 

# create app directory in container
RUN mkdir -p /home/ubuntu/projects/fetch39-chat/
RUN mkdir -p /home/ubuntu/projects/Fetch39Files/Fetch39doc
RUN mkdir -p /home/ubuntu/projects/Fetch39Files/Fetch39Image
# set /app directory as default working directory
WORKDIR /home/ubuntu/projects/fetch39-chat/

# only copy package.json initially so that `RUN yarn` layer is recreated only
# if there are changes in package.json
ADD package.json yarn.lock /home/ubuntu/projects/fetch39-chat/

# --pure-lockfile: Don’t generate a yarn.lock lockfile
RUN yarn --pure-lockfile

# copy all file from current dir to /app in container
COPY . /home/ubuntu/projects/fetch39-chat/

# expose port 9002
EXPOSE 9002


# cmd to start service
CMD [ "yarn", "start"]
