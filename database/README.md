# Database

Provides the database for other resources to use, abstracted away into events. The database used is MongoDB. This resource contains many custom models and functions to process data stored in the database.

## Improvements

- I am unsure if this level of abstraction is necessary. It may be better to just allow each resource to directly access the database with it's own server script. They could still share models etc.
