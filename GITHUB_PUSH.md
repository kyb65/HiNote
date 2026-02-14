# GitHub에 올리기 (한 번만 하면 됨)

로컬에는 이미 **첫 커밋**까지 완료된 상태입니다. 아래만 하면 GitHub에 반영됩니다.

## 1. GitHub에서 저장소 만들기

1. https://github.com/new 접속
2. **Repository name**: `HiNote` (원하면 다른 이름도 가능)
3. **Public** 선택
4. **"Add a README"** 등 체크 해제 (로컬에 이미 코드 있음)
5. **Create repository** 클릭

## 2. 터미널에서 원격 연결 후 푸시

저장소를 만든 뒤, GitHub에 나오는 **저장소 URL**을 복사한 다음:

```powershell
cd "c:\Users\kybna\OneDrive\CodeWorkspaces\CursorWorkspace\HiNote"

# 본인 아이디/저장소이름으로 바꾸기. 예: https://github.com/kybna/HiNote.git
git remote add origin https://github.com/본인아이디/HiNote.git

# 기본 브랜치를 main으로 맞추고 푸시
git branch -M main
git push -u origin main
```

**SSH를 쓰는 경우** (이미 SSH 키 설정돼 있으면):

```powershell
git remote add origin git@github.com:본인아이디/HiNote.git
git branch -M main
git push -u origin main
```

첫 푸시 시 GitHub 로그인 또는 토큰/SSH 인증이 필요할 수 있습니다.

---

이후에는 수정 후 다음만 반복하면 됩니다:

```powershell
git add .
git commit -m "메시지"
git push
```

**PR(Pull Request)** 은 보통 다른 사람 브랜치를 병합할 때 사용합니다. 본인만 쓰는 저장소면 `main`에 바로 `git push` 하면 됩니다.
