import os
import zipfile

def create_project_zip():
    output_filename = 'ulpf_complete_redesign.zip'
    exclude_dirs = {'.git', 'node_modules', 'dist', '__pycache__', '.pytest_cache', '.venv', 'venv', '.agents'}
    exclude_extensions = {'.pyc', '.pyo', '.pyd'}

    print(f"Creating zip archive '{output_filename}'...")
    
    with zipfile.ZipFile(output_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk('.'):
            # Exclude unwanted directories in-place
            dirs[:] = [d for d in dirs if d not in exclude_dirs]
            
            for file in files:
                if file == output_filename or any(file.endswith(ext) for ext in exclude_extensions):
                    continue
                
                file_path = os.path.join(root, file)
                arcname = os.path.relpath(file_path, '.')
                zipf.write(file_path, arcname)
                print(f"  + Added {arcname}")

    size_mb = os.path.getsize(output_filename) / (1024 * 1024)
    print(f"\nSuccessfully created {output_filename} ({size_mb:.2f} MB)")
    print(f"Location: {os.path.abspath(output_filename)}")

if __name__ == '__main__':
    create_project_zip()
