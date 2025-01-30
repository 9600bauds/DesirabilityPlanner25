# Get the current directory path
$currentPath = (Get-Location).Path
$parentPath = Split-Path -Parent $currentPath
$folderName = Split-Path -Leaf $currentPath
$newFolderName = "${folderName}_renamed"
$targetPath = Join-Path -Path $parentPath -ChildPath $newFolderName

# Define folders to ignore
$ignoreFolders = @(
    'dist',
    'node_modules',
    'build'
)

# Define allowed MIME types that don't need .txt extension
$allowedMimeTypes = @(
    'application/pdf',
    'application/x-javascript',
    'text/javascript',
    'application/x-python',
    'text/x-python',
    'text/plain',
    'text/html',
    'text/css',
    'text/md',
    'text/csv',
    'text/xml',
    'text/rtf',
    'application/json'
)

# Function to get MIME type of a file
function Get-MimeType($filePath) {
    try {
        $extension = [System.IO.Path]::GetExtension($filePath).ToLower()
        switch ($extension) {
            ".pdf"  { return "application/pdf" }
            ".js"   { return "application/x-javascript" }
            ".py"   { return "application/x-python" }
            ".txt"  { return "text/plain" }
            ".html" { return "text/html" }
            ".htm"  { return "text/html" }
            ".css"  { return "text/css" }
            ".md"   { return "text/md" }
            ".csv"  { return "text/csv" }
            ".xml"  { return "text/xml" }
            ".rtf"  { return "text/rtf" }
            ".json" { return "application/json" }
            default { return "application/octet-stream" }
        }
    }
    catch {
        return "application/octet-stream"
    }
}

# Function to sanitize file path
function Get-SafePath($path) {
    try {
        return [System.IO.Path]::GetFullPath($path)
    }
    catch {
        Write-Error "Invalid path: $path"
        return $null
    }
}

# Function to check if a path should be ignored
function Should-IgnorePath($path) {
    foreach ($folder in $ignoreFolders) {
        if ($path -match "\\$folder\\?" -or $path -match "\\$folder$") {
            return $true
        }
    }
    return $false
}

# Function to process files
function Process-Files($sourcePath, $targetPath) {
    # Get all items in the source directory
    Get-ChildItem -Path $sourcePath -Recurse | ForEach-Object {
        try {
            # Calculate the relative path from source
            $relativePath = $_.FullName.Substring($sourcePath.Length).TrimStart('\')
            
            # Check if path should be ignored
            if (Should-IgnorePath $_.FullName) {
                Write-Host "Skipping ignored path: $($_.FullName)" -ForegroundColor Yellow
                return
            }

            if ($_.PSIsContainer) {
                # If it's a directory, create it in the target
                $newPath = Get-SafePath (Join-Path $targetPath $relativePath)
                if ($newPath -and !(Test-Path -Path $newPath)) {
                    New-Item -ItemType Directory -Path $newPath -Force | Out-Null
                }
            }
            else {
                # If it's a file, copy it with appropriate naming
                $targetDir = Get-SafePath (Join-Path $targetPath (Split-Path -Parent $relativePath))
                $fileName = $_.Name
                
                # Check MIME type and adjust filename if needed
                $mimeType = Get-MimeType -filePath $_.FullName
                if ($mimeType -notin $allowedMimeTypes) {
                    $fileName = "$fileName.txt"
                }
                
                if ($targetDir) {
                    # Ensure target directory exists
                    if (!(Test-Path -Path $targetDir)) {
                        New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
                    }
                    
                    $targetFile = Join-Path $targetDir $fileName
                    Copy-Item -Path $_.FullName -Destination $targetFile -Force
                }
            }
        }
        catch {
            Write-Error "Error processing $($_.FullName): $_"
        }
    }
}

# Remove target directory if it exists
if (Test-Path -Path $targetPath) {
    Remove-Item -Path $targetPath -Recurse -Force
}

# Create new target directory
New-Item -ItemType Directory -Path $targetPath -Force | Out-Null

# Start processing files
try {
    Process-Files -sourcePath $currentPath -targetPath $targetPath
    Write-Host "Folder copied and files processed successfully to: $targetPath" -ForegroundColor Green
}
catch {
    Write-Error "An error occurred: $_"
}