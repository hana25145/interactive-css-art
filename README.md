
# Interactive CSS Art — Starter

이 저장소는 여러 개의 **분리된 HTML/CSS/JS 작품**을 한 웹사이트 안에서 관리하기 쉬운 구조로 제공합니다.

## 구조
```
/assets/        # 공통 리소스
  css/base.css  # 공통 스타일(갤러리 등)
  js/main.js    # 공통 스크립트(선택)
/works/
  prism-comet/  # 예시 작품 1
    index.html
    style.css
    script.js
  _template/    # 새 작품 시작용 템플릿
    index.html
    style.css
    script.js
index.html      # 갤러리
```

## 사용법
1. `works/_template` 폴더를 복제해서 `works/새이름`으로 바꾸세요.
2. `works/새이름/index.html`의 `<title>`과 내용 수정.
3. `style.css`, `script.js`에 작품 코드 작성.
4. 루트의 `index.html`에 카드(링크) 하나 추가.

## 배포(GitHub Pages)
- 저장소 루트에 `index.html`이 있어야 합니다.
- Settings → Pages → Branch: `main`, Folder: `/root` 설정.
- 배포 후 `https://사용자명.github.io/저장소명/`에서 접속.

행복한 창작 되세요! ✨
