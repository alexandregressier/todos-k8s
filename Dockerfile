FROM node:18.18.2-alpine
WORKDIR /opt/backend/
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm clean-install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]