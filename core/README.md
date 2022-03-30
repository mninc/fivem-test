# Core

A basic client resource that provides some useful events for other resources.
Loads character attributes from the database and allows other resources to update them - saving the updates to the database and informing the other resources.
Also wraps `DisableControlAction` so other resources can just specify which general actions they want to block - for example attacking, moving, looking around and entering the pause menu.
