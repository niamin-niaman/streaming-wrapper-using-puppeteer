# streaming-wrapper-using-puppeteer

<p style="display:flex; justify-content:center; align-items:center;" align="center">
  <a href="https://pptr.dev/" target="blank"><img src="https://user-images.githubusercontent.com/10379601/29446482-04f7036a-841f-11e7-9872-91d1fc2ea683.png" width="120" alt="Puppeteer Logo" /></a>
  <img src="./img/x.png" width="20" alt="x" />
  <img src="./img/streaming.png" width="120" alt="Streaming Logo" />
</p>

Wrapper สำหรับใช้งาน Streaming ผ่าน Puppeteer ที่จะช่วยให้การบันทึกข้อมูลจาก Portfolio หรือ ซื้อขายได้ง่ายขึ้น

# ควรรู้
- Lib ชุดนี้ยังไม่เสร็จสมบูรณ์ อย่าเพิ่งนำไปซื้อขายจริง
- อยู่ในระหว่าง Refactor code ใหเป็น Class Perttern
# getting started

- clone this project
- ใช้คำสั่ง

```
    npm install
```

- ย้ายไป src directory
```
    cd src
```
- แก้ไขไฟล์ .env.example ให้เป็น .env
- เพิ่มเติมข้อมูลเกี่ยวกับบัญชีหุ้น ใน .env

```
    BROKER = 'ABC' // ตัวย่อโบรกเกอร์
    USER_NAME = '1234' // user name
    PASSWORD = 'XYZ' // password
```

- ใช้คำสั่ง

```
    node index.js
```
