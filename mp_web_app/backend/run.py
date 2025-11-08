from files.models import FileMetadata, FileMetadataFull

full = FileMetadataFull(
    id="123",
    file_name="report.pdf",
    file_type="forms",
    uploaded_by="alice",
    bucket="private-bucket",
    key="files/2025/report.pdf",
    allowed_to=["alice", "bob"]
)

partial = FileMetadata(
    id="123",
    file_name="report.pdf",
    file_type="forms",
    uploaded_by="alice"
)


print(FileMetadata.model_fields.keys())
print(partial.model_dump() == full.model_dump(include=FileMetadata.model_fields.keys()))
