# Pesti - Early Warning System

A comprehensive early warning system for pest monitoring and forecasting.

## Project Structure

This is a **monorepo** using Git Submodules to manage the backend and frontend components:

- `backend/` - Python backend API (EWS-2) - Submodule: [Hino-code/EWS-2](https://github.com/Hino-code/EWS-2)
- `frontend/` - React/TypeScript frontend application - Submodule: [Hino-code/early-warning-system](https://github.com/Hino-code/early-warning-system)

## Initial Setup

### Cloning the Repository

Since this repository uses Git Submodules, clone it with:

```bash
git clone --recurse-submodules https://github.com/Hino-code/pesti.git
```

If you've already cloned without submodules:

```bash
git submodule update --init --recursive
```

### Backend Setup

Navigate to the backend directory and follow the instructions in `backend/README.md`.

### Frontend Setup

Navigate to the frontend directory and follow the instructions in `frontend/README.md`.

## Working with Submodules

### Pulling Updates from Original Repos

To fetch the latest changes from the original repositories:

```bash
git submodule update --remote
```

This will update both submodules to their latest commits from their respective remotes.

### Working in a Submodule

To make changes in a submodule:

```bash
cd backend/  # or frontend/
# Make your changes
git add .
git commit -m "Your commit message"
git push origin main  # Pushes to the submodule's repository
```

### Syncing Submodule Changes to Parent Repo

After updating a submodule, commit the reference update in the parent repo:

```bash
# Return to parent repo root
cd /Users/jino/Desktop/Capstone/System
git add backend frontend  # or just the submodule you updated
git commit -m "Update submodules to latest version"
git push origin main
```

### Updating Specific Submodule

To update only one submodule:

```bash
git submodule update --remote backend  # or frontend
```

## Development Workflow

### Current Phase: Active Development in Original Repos

1. **Develop in original repos**:
   - Continue working directly in `Hino-code/EWS-2` and `Hino-code/early-warning-system`
   - Commit and push changes to those repositories as usual

2. **Fetch updates into pesti**:
   ```bash
   git submodule update --remote
   git add backend frontend
   git commit -m "Update from upstream repos"
   git push origin main
   ```

3. **Push changes from pesti back to original repos** (when needed):
   ```bash
   cd backend/  # or frontend/
   # Make changes in pesti monorepo
   git add .
   git commit -m "Changes made in pesti"
   git push origin main  # Pushes to original repo
   
   # Then update parent repo reference
   cd ..
   git add backend  # or frontend
   git commit -m "Sync changes to original repo"
   git push origin main
   ```

### Future Phase: Finalized Development in Pesti

When the original repos are finalized, you can work directly in the pesti monorepo:

- Make changes directly in `backend/` or `frontend/` subdirectories
- Commit changes in the submodule
- Push to original repos if needed
- Update parent repo references

## Notes

- Each submodule maintains its own git history and is an independent repository
- The parent repo tracks specific commit references from each submodule
- Always commit submodule updates in the parent repo after making changes
- Both backend and frontend submodules point to your repositories, so you have full push access

