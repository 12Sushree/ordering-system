# ordering-system

MongoDB Compass should connect to the same Docker Mongo URI used by the backend:

`mongodb://localhost:27018/ordering_system?directConnection=true&retryWrites=true&w=majority`

The live database is `ordering_system`, and the main collections are:

- `orders`
- `products`
- `analytics`
- `processedevents`
- `outboxevents`

If Compass is open against an older standalone connection on `27017`, reconnect with the URI above and refresh the database tree.
