The problem was caused by two main issues:
1. `btoa` was crashing when it encountered non-Latin characters (like Arabic emails or names) which crashed the UI. This was fixed by using `encodeURIComponent` before base64 encoding.
2. Nested HTML `<form>` tags in the Account recovery section were causing the browser to trigger a full page reload when a form was submitted, kicking you out of the preview. This was fixed by restructuring the forms.
