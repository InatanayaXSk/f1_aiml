"""Script to add JSON export cell to combined_pipeline.ipynb"""
import json
from pathlib import Path

notebook_path = Path(r"E:\5thsem\AIML\f1-2026-simulator\notebooks\combined_pipeline.ipynb")

# Read the notebook
with open(notebook_path, 'r', encoding='utf-8') as f:
    notebook = json.load(f)

# Create the new JSON export cell
json_export_cell = {
    "cell_type": "markdown",
    "id": "json-export-header",
    "metadata": {},
    "source": [
        "## 📤 Generate JSON Outputs for Frontend\n",
        "\n",
        "Export regulation impact data in 5 JSON formats for frontend visualization."
    ]
}

json_code_cell = {
    "cell_type": "code",
    "execution_count": None,
    "id": "json-export-code",
    "metadata": {},
    "outputs": [],
    "source": [
        "# =============================================================================\n",
        "# GENERATE JSON OUTPUTS FOR FRONTEND VISUALIZATION\n",
        "# =============================================================================\n",
        "\n",
        "print(\"=\" * 70)\n",
        "print(\"🎯 GENERATING JSON OUTPUTS FOR FRONTEND VISUALIZATION\")\n",
        "print(\"=\" * 70)\n",
        "\n",
        "# Import the JSON exporter\n",
        "try:\n",
        "    from src.json_exporter import export_all_jsons\n",
        "    \n",
        "    # Export all JSON files\n",
        "    json_files = export_all_jsons(\n",
        "        results=simulation_results,  # Monte Carlo results from previous section\n",
        "        model_mae=mae,               # Model MAE from training section\n",
        "        output_dir=project_root / \"outputs\"\n",
        "    )\n",
        "    \n",
        "    print(f\"\\n✅ SUCCESS! Generated {len(json_files)} JSON files\")\n",
        "    print(f\"\\n📂 Output location: {project_root / 'outputs' / 'json'}\")\n",
        "    print(\"\\n📋 Generated files:\")\n",
        "    for f in json_files:\n",
        "        print(f\"   - {f.name}\")\n",
        "    \n",
        "    print(\"\\n🎉 All JSON exports complete!\")\n",
        "    print(\"\\nYou can now use these files for frontend visualization.\")\n",
        "    \n",
        "except ImportError as e:\n",
        "    print(f\"\\n❌ Import Error: {e}\")\n",
        "    print(\"\\nMake sure src/json_exporter.py exists and src/ is in Python path.\")\n",
        "    print(\"Try restarting the notebook kernel.\")\n",
        "    \n",
        "except NameError as e:\n",
        "    print(f\"\\n❌ Name Error: {e}\")\n",
        "    print(\"\\nMake sure you've run all previous cells first.\")\n",
        "    print(\"Required variables: simulation_results, mae, project_root\")\n",
        "    \n",
        "except Exception as e:\n",
        "    print(f\"\\n❌ Error generating JSONs: {e}\")\n",
        "    import traceback\n",
        "    traceback.print_exc()"
    ]
}

# Remove the broken cells at the end (cells with empty source or the broken import)
# Find the index where cells end meaningfully
cleaned_cells = []
for cell in notebook['cells']:
    # Keep all cells except empty ones or broken ones at the very end
    source = cell.get('source', [])
    if isinstance(source, list):
        source_text = ''.join(source)
    else:
        source_text = source
    
    # Skip cells that are just imports with errors
    if 'from src.json_exporter import' in source_text and cell.get('outputs'):
        if any('ModuleNotFoundError' in str(output) for output in cell.get('outputs', [])):
            continue
    
    # Skip empty cells at the end
    if not source_text.strip():
        continue
        
    cleaned_cells.append(cell)

# Add the new cells
cleaned_cells.append(json_export_cell)
cleaned_cells.append(json_code_cell)

# Update the notebook
notebook['cells'] = cleaned_cells

# Save the updated notebook
with open(notebook_path, 'w', encoding='utf-8') as f:
    json.dump(notebook, f, indent=4, ensure_ascii=False)

print(f"✅ Updated {notebook_path}")
print(f"✅ Added JSON export cells")
print(f"✅ Total cells: {len(notebook['cells'])}")
