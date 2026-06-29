from typing import List
from app.schemas.usage import UsageWarning


def compute_warnings(
    files_count: int,
    max_files: int,
    storage_bytes: int,
    max_storage_bytes: int,
    questions_used: int,
    max_questions: int,
) -> List[UsageWarning]:
    warnings = []
    if max_files > 0 and files_count / max_files >= 0.9:
        warnings.append(UsageWarning(
            code="files_near_limit",
            message=f"You are using {files_count}/{max_files} files",
            severity="warning",
        ))
    if max_storage_bytes > 0 and storage_bytes / max_storage_bytes >= 0.9:
        warnings.append(UsageWarning(
            code="storage_near_limit",
            message="Storage usage is near the limit",
            severity="warning",
        ))
    if max_questions > 0 and questions_used / max_questions >= 0.9:
        warnings.append(UsageWarning(
            code="questions_near_limit",
            message=f"You have used {questions_used}/{max_questions} questions",
            severity="warning",
        ))
    return warnings
