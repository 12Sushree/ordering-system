#!/usr/bin/env bash
set -euo pipefail

until mongosh mongodb://mongo:27017 --quiet --eval 'db.runCommand({ ping: 1 })' >/dev/null 2>&1; do
  sleep 1
done

mongosh mongodb://mongo:27017 --quiet --eval '
  try {
    rs.status();
  } catch (error) {
    rs.initiate({
      _id: "rs0",
      members: [
        {
          _id: 0,
          host: "localhost:27018"
        }
      ]
    });
  }
'
