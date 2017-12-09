FROM mongo

RUN mkdir -p /data/db2 

COPY . /data/db2

RUN mongod --fork --logpath /var/log/mongodb.log --smallfiles \
    && mongoimport --drop -d mongomart -c item /data/db2/items.json \
    && mongoimport --drop -d mongomart -c cart /data/db2/cart.json \
    && rm /tmp/mongodb-27017.sock

# Make the new dir a VOLUME to persists it 
VOLUME /data/db2

EXPOSE 27017