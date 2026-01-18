"""Fix notebook for local system (remove Colab setup)"""
import json
from pathlib import Path

notebook_path = Path(r"E:\5thsem\AIML\f1-2026-simulator\notebooks\combined_pipeline.ipynb")

# Read notebook
with open(notebook_path, 'r', encoding='utf-8') as f:
    notebook = json.load(f)

# Find and update the setup cell (first code cell)
for i, cell in enumerate(notebook['cells']):
    if cell['cell_type'] == 'code':
        source = ''.join(cell.get('source', []))
        
        # Check if this is the setup cell with Colab detection
        if 'IN_COLAB' in source or 'google.colab' in source:
            # Replace with local setup
            cell['source'] = [
                "# Core imports\n",
                "from pathlib import Path\n",
                "import json\n",
                "import os\n",
                "import sys\n",
                "import warnings\n",
                "warnings.filterwarnings('ignore')\n",
                "\n",
                "# Set project root (local system)\n",
                "project_root = Path.cwd()\n",
                "\n",
                "# If we're in notebooks/, go up one level\n",
                "if project_root.name == 'notebooks' and (project_root.parent / 'src').exists():\n",
                "    project_root = project_root.parent\n",
                "elif not (project_root / 'src').exists() and (project_root.parent / 'src').exists():\n",
                "    project_root = project_root.parent\n",
                "\n",
                "# Add to Python path\n",
                "if str(project_root) not in sys.path:\n",
                "    sys.path.insert(0, str(project_root))\n",
                "if str(project_root / 'src') not in sys.path:\n",
                "    sys.path.insert(0, str(project_root / 'src'))\n",
                "\n",
                "# Create outputs directory\n",
                "charts_dir = project_root / 'outputs' / 'comparison_charts'\n",
                "charts_dir.mkdir(parents=True, exist_ok=True)\n",
                "\n",
                "print(f\"✅ Project root: {project_root}\")\n",
                "print(f\"✅ src path: {project_root / 'src'}\")\n",
                "print(f\"✅ Charts directory: {charts_dir}\")"
            ]
            cell['outputs'] = []
            cell['execution_count'] = None
            print(f"✅ Updated setup cell at index {i}")
            break

# Save updated notebook
with open(notebook_path, 'w', encoding='utf-8') as f:
    json.dump(notebook, f, indent=4, ensure_ascii=False)

print(f"✅ Fixed {notebook_path} for local system")
print("✅ Removed Colab setup code")
