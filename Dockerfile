FROM node:18-slim

# Install system packages required for font rendering
RUN apt-get update && apt-get install -y \
  fontconfig \
  libfontconfig1 \
  libfreetype6 \
  libpng-dev \
  libjpeg-dev \
  libpango1.0-0 \
  libgif-dev \
  libcairo2 \
  libpangoft2-1.0-0 \
  libpangocairo-1.0-0 \
  libharfbuzz0b \
  && apt-get clean && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy files to container
COPY . .

# Install NPM packages
RUN npm install

# Run app
CMD ["npm", "start"]
