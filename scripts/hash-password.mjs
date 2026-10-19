// 관리자 비밀번호 해시 만들기 (#118): npm run hash-password
// 입력한 비밀번호는 화면에 보이지 않고, 저장되지도 않는다. 출력된 한 줄을 .env.local · Vercel 환경변수에 넣는다
// 형식은 lib/password-hash.ts와 같다: scrypt:N:r:p:salt:hash
import { randomBytes, scryptSync } from "node:crypto";
import readline from "node:readline";

function ask(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl._writeToOutput = (s) => {
      // 입력 글자는 출력하지 않고 질문만 보인다
      if (s.includes(question)) rl.output.write(s);
    };
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write("\n");
      resolve(answer);
    });
  });
}

const first = await ask("새 관리자 비밀번호: ");
if (first.length < 12) {
  console.error("12자 이상으로 정해 주세요.");
  process.exit(1);
}
const second = await ask("한 번 더 입력: ");
if (first !== second) {
  console.error("두 번 입력한 비밀번호가 달라요.");
  process.exit(1);
}

const N = 16384, r = 8, p = 1;
const salt = randomBytes(16);
const hash = scryptSync(first, salt, 32, { N, r, p });
console.log("\n아래 한 줄을 환경변수로 넣으세요:\n");
console.log(`ADMIN_PASSWORD_HASH=${["scrypt", N, r, p, salt.toString("base64url"), hash.toString("base64url")].join(":")}`);
