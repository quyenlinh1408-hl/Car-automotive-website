# Deploy Nhanh Cho QuyenlinhFPTAuto.vn

## Cach 1: Netlify (de nhat)
1. Tao tai khoan Netlify va dang nhap.
2. Chon Add new site > Import an existing project.
3. Ket noi repo GitHub chua project nay.
4. Build command: de trong.
5. Publish directory: `.`
6. Deploy.
7. Vao Domain settings, gan custom domain: quyenlinhfptauto.vn.
8. Trong DNS nha cung cap domain, tao ban ghi theo huong dan Netlify.
9. Bat HTTPS (SSL) trong Netlify.

Netlify se tu doc file `netlify.toml` da setup san.

## Cach 2: Vercel
1. Tao tai khoan Vercel va dang nhap.
2. Chon New Project, import repo.
3. Framework preset: Other.
4. Build command: de trong.
5. Output directory: de trong.
6. Deploy.
7. Vao Settings > Domains, them quyenlinhfptauto.vn.
8. Cap nhat DNS theo huong dan Vercel.

Vercel se tu doc file `vercel.json` da setup san.

## Sau Khi Deploy
1. Kiem tra:
- https://quyenlinhfptauto.vn/
- https://quyenlinhfptauto.vn/car.html
- https://quyenlinhfptauto.vn/feedback.html
- https://quyenlinhfptauto.vn/robots.txt
- https://quyenlinhfptauto.vn/sitemap.xml

2. Vao Google Search Console:
- Add property domain: quyenlinhfptauto.vn
- Submit sitemap: https://quyenlinhfptauto.vn/sitemap.xml
- Request indexing cho car.html va feedback.html

## Luu y van hanh
- Moi lan sua code chi can push Git, Netlify/Vercel se auto deploy.
- Neu doi URL hoac them trang moi, cap nhat sitemap.xml.
