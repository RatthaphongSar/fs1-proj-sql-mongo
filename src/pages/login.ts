import { loginApi, registerWithOtpApi, sendOtpApi, verifyOtpApi } from "../api/api.js";
import { renderNavbarState, setCurrentUser, showToast } from "../app.js";

let currentRegEmail = "";
let verifiedOtpCode = "";
let resendCountdown = 0;
let resendTimer: number | undefined = undefined;

function initLoginPage(): void {
    renderNavbarState();
    bindAuthTabs();
    bindPasswordToggles();
    bindLoginSubmit();
    bindStep1SendOtp();
    bindStep2OtpBoxes();
    bindStep3ProfileRegister();
}

function bindAuthTabs(): void {
    const tabLogin = document.getElementById("tab-btn-login");
    const tabRegister = document.getElementById("tab-btn-register");
    const linkToRegister = document.getElementById("link-to-register");
    const panelLogin = document.getElementById("panel-login");
    const panelRegister = document.getElementById("panel-register");

    const switchTab = (mode: "login" | "register") => {
        if (!tabLogin || !tabRegister || !panelLogin || !panelRegister) return;
        if (mode === "login") {
            tabLogin.classList.add("active");
            tabRegister.classList.remove("active");
            panelLogin.style.display = "block";
            panelRegister.style.display = "none";
        } else {
            tabRegister.classList.add("active");
            tabLogin.classList.remove("active");
            panelRegister.style.display = "block";
            panelLogin.style.display = "none";
        }
    };

    if (tabLogin) tabLogin.addEventListener("click", () => switchTab("login"));
    if (tabRegister) tabRegister.addEventListener("click", () => switchTab("register"));
    if (linkToRegister) linkToRegister.addEventListener("click", () => switchTab("register"));
}

function bindPasswordToggles(): void {
    const bindToggle = (btnId: string, inputId: string) => {
        const btn = document.getElementById(btnId);
        const input = document.getElementById(inputId) as HTMLInputElement | null;
        if (!btn || !input) return;
        btn.addEventListener("click", () => {
            const isPwd = input.type === "password";
            input.type = isPwd ? "text" : "password";
            btn.textContent = isPwd ? "ซ่อน" : "แสดง";
        });
    };

    bindToggle("toggle-login-pwd", "login-password");
    bindToggle("toggle-reg-pwd", "reg-password");
}

function setWizardStep(step: 1 | 2 | 3): void {
    const s1 = document.getElementById("reg-step-1");
    const s2 = document.getElementById("reg-step-2");
    const s3 = document.getElementById("reg-step-3");

    const n1 = document.getElementById("step-node-1");
    const n2 = document.getElementById("step-node-2");
    const n3 = document.getElementById("step-node-3");

    if (s1) s1.style.display = step === 1 ? "block" : "none";
    if (s2) s2.style.display = step === 2 ? "block" : "none";
    if (s3) s3.style.display = step === 3 ? "block" : "none";

    if (n1 && n2 && n3) {
        n1.className = `reg-step-node ${step === 1 ? "active" : "completed"}`;
        n2.className = `reg-step-node ${step === 2 ? "active" : step > 2 ? "completed" : ""}`;
        n3.className = `reg-step-node ${step === 3 ? "active" : ""}`;
    }
}

function bindLoginSubmit(): void {
    const loginForm = document.getElementById("login-form") as HTMLFormElement | null;
    const submitBtn = document.getElementById("btn-login-submit") as HTMLButtonElement | null;
    if (!loginForm) return;

    loginForm.addEventListener("submit", async (e: Event) => {
        e.preventDefault();
        const ident = (document.getElementById("login-identifier") as HTMLInputElement).value.trim();
        const pass = (document.getElementById("login-password") as HTMLInputElement).value;

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = "กำลังตรวจสอบข้อมูลบัญชี...";
        }

        try {
            const user = await loginApi(ident, pass);
            setCurrentUser(user);
            showToast(`เข้าสู่ระบบสำเร็จในชื่อ ${user.display_name}`);

            setTimeout(() => {
                if (user.role === "admin") {
                    window.location.href = "/pages/admin.html";
                } else {
                    window.location.href = "/";
                }
            }, 450);
        } catch (err) {
            showToast((err as Error).message, true);
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = "เข้าสู่ระบบ";
            }
        }
    });
}

function bindStep1SendOtp(): void {
    const emailInput = document.getElementById("reg-email") as HTMLInputElement | null;
    const sendBtn = document.getElementById("btn-step1-send-otp") as HTMLButtonElement | null;
    const changeEmailBtn = document.getElementById("btn-change-email");
    const resendBtn = document.getElementById("btn-resend-otp") as HTMLButtonElement | null;

    // Domain Quick Chips (@gmail.com, etc.)
    document.querySelectorAll<HTMLButtonElement>("[data-domain]").forEach((chip) => {
        chip.addEventListener("click", () => {
            if (!emailInput) return;
            const domain = chip.dataset.domain || "@gmail.com";
            const base = emailInput.value.split("@")[0].trim() || "user";
            emailInput.value = `${base}${domain}`;
            emailInput.focus();
        });
    });

    const triggerOtpSend = async () => {
        if (!emailInput) return;
        const email = emailInput.value.trim().toLowerCase();
        if (!email || !email.includes("@") || !email.includes(".")) {
            showToast("กรุณากรอกอีเมลให้ถูกต้อง เช่น yourname@gmail.com", true);
            emailInput.focus();
            return;
        }

        if (sendBtn) {
            sendBtn.disabled = true;
            sendBtn.textContent = "กำลังส่งรหัส OTP ไปยังอีเมล...";
        }

        try {
            const res = await sendOtpApi(email);
            currentRegEmail = email;
            showToast(res.message);

            const targetEmailEl = document.getElementById("display-target-email");
            if (targetEmailEl) targetEmailEl.textContent = email;

            // Render Gmail Notification Card
            const gmailCard = document.getElementById("gmail-otp-card");
            if (gmailCard) {
                gmailCard.style.display = "flex";
                if (res.smtp_sent) {
                    gmailCard.innerHTML = `
                        <div style="display:flex; align-items:center; gap:0.75rem;">
                            <div class="gmail-badge-icon">M</div>
                            <div>
                                <div style="font-weight:700; font-size:0.84rem; color:#09090b;">ส่งอีเมลไปยังกล่องจดหมาย Gmail แล้ว</div>
                                <div style="font-size:0.76rem; color:#52525b;">กรุณาเปิดอีเมล ${res.email} แล้วนำรหัส 6 หลักมากรอกด้านล่าง</div>
                            </div>
                        </div>
                    `;
                } else if (res.otp_preview) {
                    gmailCard.innerHTML = `
                        <div style="display:flex; align-items:center; gap:0.75rem;">
                            <div class="gmail-badge-icon">M</div>
                            <div>
                                <div style="font-size:0.74rem; color:#71717a; font-weight:600;">GMAIL OTP NOTIFICATION • ${res.email}</div>
                                <div style="font-weight:800; font-size:0.95rem; color:#09090b;">
                                    รหัสยืนยันของคุณคือ: <span style="color:#ea580c; letter-spacing:2px; font-size:1.1rem;">${res.otp_preview}</span>
                                </div>
                            </div>
                        </div>
                        <button type="button" id="btn-autofill-otp" class="btn btn-outline-orange btn-sm" style="white-space:nowrap;">
                            กรอกรหัสอัตโนมัติ
                        </button>
                    `;
                    const autofillBtn = document.getElementById("btn-autofill-otp");
                    if (autofillBtn) {
                        autofillBtn.addEventListener("click", () => {
                            fillOtpDigits(res.otp_preview!);
                        });
                    }
                    // กรอกรหัสลงช่อง 6 หลักให้อัตโนมัติทันทีเพื่อความสะดวกสูงสุด
                    fillOtpDigits(res.otp_preview);
                }
            }

            setWizardStep(2);
            startResendCooldown();
        } catch (err) {
            showToast((err as Error).message, true);
        } finally {
            if (sendBtn) {
                sendBtn.disabled = false;
                sendBtn.textContent = "รับรหัสยืนยัน OTP (6 หลัก) →";
            }
        }
    };

    if (sendBtn) sendBtn.addEventListener("click", triggerOtpSend);
    if (emailInput) {
        emailInput.addEventListener("keydown", (e: KeyboardEvent) => {
            if (e.key === "Enter") {
                e.preventDefault();
                triggerOtpSend();
            }
        });
    }

    if (changeEmailBtn) {
        changeEmailBtn.addEventListener("click", () => {
            setWizardStep(1);
        });
    }

    if (resendBtn) {
        resendBtn.addEventListener("click", () => {
            if (resendCountdown <= 0) {
                triggerOtpSend();
            }
        });
    }
}

function startResendCooldown(): void {
    const resendBtn = document.getElementById("btn-resend-otp") as HTMLButtonElement | null;
    if (!resendBtn) return;

    resendCountdown = 30;
    resendBtn.disabled = true;
    if (resendTimer) window.clearInterval(resendTimer);

    resendTimer = window.setInterval(() => {
        if (resendCountdown > 0) {
            resendCountdown--;
            resendBtn.textContent = `ส่งรหัสใหม่อีกครั้ง (${resendCountdown}s)`;
        } else {
            window.clearInterval(resendTimer);
            resendBtn.disabled = false;
            resendBtn.textContent = "กดส่งรหัส OTP ใหม่อีกครั้ง";
        }
    }, 1000);
}

function getOtpBoxes(): HTMLInputElement[] {
    return Array.from(document.querySelectorAll<HTMLInputElement>(".otp-digit-input"));
}

function fillOtpDigits(code: string): void {
    const boxes = getOtpBoxes();
    const clean = code.replace(/\D/g, "").slice(0, 6);
    boxes.forEach((box, idx) => {
        box.value = clean[idx] || "";
    });
}

function collectOtpCode(): string {
    return getOtpBoxes()
        .map((b) => b.value.trim())
        .join("");
}

function bindStep2OtpBoxes(): void {
    const boxes = getOtpBoxes();
    const verifyBtn = document.getElementById("btn-step2-verify-otp") as HTMLButtonElement | null;

    boxes.forEach((box, idx) => {
        box.addEventListener("input", () => {
            box.value = box.value.replace(/\D/g, "").slice(-1);
            if (box.value && idx < boxes.length - 1) {
                boxes[idx + 1].focus();
            }
        });

        box.addEventListener("keydown", (e: KeyboardEvent) => {
            if (e.key === "Backspace" && !box.value && idx > 0) {
                boxes[idx - 1].focus();
            } else if (e.key === "Enter" && collectOtpCode().length === 6) {
                e.preventDefault();
                verifyBtn?.click();
            }
        });

        box.addEventListener("paste", (e: ClipboardEvent) => {
            e.preventDefault();
            const pasted = e.clipboardData?.getData("text") || "";
            fillOtpDigits(pasted);
        });
    });

    if (verifyBtn) {
        verifyBtn.addEventListener("click", async () => {
            const code = collectOtpCode();
            if (code.length !== 6) {
                showToast("กรุณากรอกรหัส OTP ให้ครบทั้ง 6 หลัก", true);
                return;
            }

            verifyBtn.disabled = true;
            verifyBtn.textContent = "กำลังตรวจสอบรหัส OTP...";

            try {
                await verifyOtpApi(currentRegEmail, code);
                verifiedOtpCode = code;
                showToast("ยืนยันรหัส OTP ถูกต้อง กรุณาตั้งค่าข้อมูลบัญชีของคุณ");

                const badgeEl = document.getElementById("verified-email-badge");
                if (badgeEl) badgeEl.textContent = currentRegEmail;

                const usernameInput = document.getElementById("reg-username") as HTMLInputElement | null;
                if (usernameInput && !usernameInput.value) {
                    usernameInput.value = currentRegEmail.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "");
                }

                setWizardStep(3);
            } catch (err) {
                showToast((err as Error).message, true);
            } finally {
                verifyBtn.disabled = false;
                verifyBtn.textContent = "ยืนยันรหัส OTP →";
            }
        });
    }
}

function bindStep3ProfileRegister(): void {
    // Role Choice Cards
    const roleCards = document.querySelectorAll<HTMLElement>(".role-choice-card");
    const roleHidden = document.getElementById("reg-role") as HTMLInputElement | null;

    roleCards.forEach((card) => {
        card.addEventListener("click", () => {
            roleCards.forEach((c) => c.classList.remove("selected"));
            card.classList.add("selected");
            if (roleHidden) {
                roleHidden.value = card.dataset.roleVal || "customer";
            }
        });
    });

    // Password Strength Bar
    const pwdInput = document.getElementById("reg-password") as HTMLInputElement | null;
    const strengthFill = document.getElementById("pwd-strength-fill");
    if (pwdInput && strengthFill) {
        pwdInput.addEventListener("input", () => {
            const len = pwdInput.value.length;
            if (len === 0) {
                strengthFill.style.width = "0%";
            } else if (len < 6) {
                strengthFill.style.width = "35%";
                strengthFill.style.background = "#dc2626";
            } else if (len < 9) {
                strengthFill.style.width = "70%";
                strengthFill.style.background = "#f59e0b";
            } else {
                strengthFill.style.width = "100%";
                strengthFill.style.background = "#16a34a";
            }
        });
    }

    // Final Registration Form Submit
    const profileForm = document.getElementById("register-profile-form") as HTMLFormElement | null;
    const finalBtn = document.getElementById("btn-final-register") as HTMLButtonElement | null;

    if (profileForm) {
        profileForm.addEventListener("submit", async (e: Event) => {
            e.preventDefault();
            const username = (document.getElementById("reg-username") as HTMLInputElement).value.trim();
            const phone = (document.getElementById("reg-phone") as HTMLInputElement).value.trim();
            const display_name = (document.getElementById("reg-display-name") as HTMLInputElement).value.trim();
            const password = (document.getElementById("reg-password") as HTMLInputElement).value;
            const confirmPwd = (document.getElementById("reg-password-confirm") as HTMLInputElement).value;
            const role = ((document.getElementById("reg-role") as HTMLInputElement).value || "customer") as "customer" | "admin";

            if (password !== confirmPwd) {
                showToast("รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน กรุณาตรวจสอบอีกครั้ง", true);
                return;
            }

            if (finalBtn) {
                finalBtn.disabled = true;
                finalBtn.textContent = "กำลังสร้างบัญชีผู้ใช้งาน...";
            }

            try {
                const newUser = await registerWithOtpApi({
                    email: currentRegEmail,
                    otp_code: verifiedOtpCode,
                    username,
                    password,
                    display_name,
                    phone,
                    role
                });
                setCurrentUser(newUser);
                showToast(`สร้างบัญชีสำเร็จ ยินดีต้อนรับ ${newUser.display_name}`);

                setTimeout(() => {
                    if (newUser.role === "admin") {
                        window.location.href = "/pages/admin.html";
                    } else {
                        window.location.href = "/";
                    }
                }, 500);
            } catch (err) {
                showToast((err as Error).message, true);
                if (finalBtn) {
                    finalBtn.disabled = false;
                    finalBtn.textContent = "เสร็จสิ้นการสมัครสมาชิกและเข้าสู่ระบบ";
                }
            }
        });
    }
}

document.addEventListener("DOMContentLoaded", initLoginPage);
