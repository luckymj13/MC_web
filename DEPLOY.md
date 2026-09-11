# LuckyMC 官网与服务架构部署文档

本项目为原生 HTML、CSS、JavaScript 纯静态官网。

**架构重大调整确认**：
1. **官网访问入口变更**：官网**不再通过 `mc.luckymj.top` 访问**，全面迁移并统一为 **`https://minecraft.luckymj.top/`**（备用原生域名为 `https://luckymj13.github.io/MC_web/`）；
2. **部署运维交割**：官网**彻底移交 GitHub Pages 托管**，享受全球 CDN 边缘加速、自动免费 SSL 证书及**永久免工信部 ICP 备案**；
3. **腾讯云服务器定位调整**：腾讯云广州服务器（`43.139.61.54`）**不再承载任何官网 Web 部署与 Nginx 更新操作**，专职运行 Minecraft 游戏服务（`mc.luckymj.top:25565`），确保游戏连接超低延迟，且彻底杜绝 80/443 端口的境内备案阻断干扰。

---

## 一、 当前系统全景与职责划分

| 服务模块 | 访问地址 / 域名 | 承载平台 / 物理节点 | 职责与作用 |
| :--- | :--- | :--- | :--- |
| **官方网站 (Web)** | **`https://minecraft.luckymj.top/`** | **GitHub Pages** (海外边缘 CDN) | 6 页面大服官网（展示世界、玩法、指南、公约、海报），**免备案、自动部署** |
| **游戏直连 (MC)** | **`mc.luckymj.top:25565`** | **腾讯云广州机房** (`43.139.61.54`) | Minecraft Java 版游戏服务端（目录 `/opt/mc_server/`），**国内极速直连** |
| **代码仓库** | `https://github.com/luckymj13/MC_web.git` | GitHub (分支: `main`) | 静态网页与素材的版本控制中心 |

---

## 二、 DNS 解析配置标准（腾讯云 / DNSPod）

为实现“官网免备案全球秒开 + 游戏国内超低延迟”，DNS 控制台统一配置如下两条核心记录：

| 主机记录 (Host) | 记录类型 (Type) | 记录值 (Value) | 说明 |
| :--- | :--- | :--- | :--- |
| **`minecraft`** | **CNAME** | **`luckymj13.github.io`** | **官网专属**：指向 GitHub Pages（免工信部备案） |
| **`mc`** | **A 记录** | **`43.139.61.54`** | **游戏直连**：直连腾讯云广州机房（10~30ms 极速畅玩） |

---

## 三、 日常更新工作流（从此告别登录服务器）

由于官网已完全由 GitHub Pages 托管，**日常更新网站不再需要登录腾讯云 Ubuntu 执行任何 SSH 脚本**。

你只需要在本地修改 HTML/CSS/JS/图片，然后在本地终端（PowerShell 或 Git Bash）执行标准的 Git 三步曲：

```bash
# 1. 添加所有变动文件
git add .

# 2. 提交更新日志
git commit -m "feat: 你的更新说明"

# 3. 推送到 GitHub main 分支
git push origin main
```

**推送成功后，GitHub Pages 会在 30 秒内自动完成全球 CDN 部署上线，全自动、零维护！**

---

## 四、 GitHub Pages 关键配置与保护文件

为确保 `minecraft.luckymj.top` 稳定生效，仓库根目录下包含两个关键配置文件，**严禁误删**：

1. **`CNAME` 文件**：
   - 文件内容仅一行：`minecraft.luckymj.top`；
   - 作用：向 GitHub 声明此仓库对应你的专属子域名，删除会导致自定义域名解绑并出现 404。
2. **`.nojekyll` 文件**：
   - 作用：告知 GitHub Pages 直接作为纯静态网站发布，跳过 Jekyll 引擎构建，使部署速度由数分钟缩短至 15~30 秒。

### GitHub 仓库后台设置核验
在 [GitHub Pages Settings](https://github.com/luckymj13/MC_web/settings/pages) 中核对：
- **Source**：`Deploy from a branch`
- **Branch**：`main` / `/ (root)`
- **Custom domain**：`minecraft.luckymj.top`（DNS check 通过）
- **Enforce HTTPS**：已勾选（自动签发 Let's Encrypt 证书）

---

## 五、 部署后在线验证

### 1. 浏览器验证
- 打开 **[https://minecraft.luckymj.top/](https://minecraft.luckymj.top/)**
- 按 **`Ctrl + F5`**（Mac 电脑按 `Cmd + Shift + R`）强制刷新本地浏览器缓存；
- 检查以下 6 个核心页面是否顺畅跳转：
  - 首页：`https://minecraft.luckymj.top/`
  - 探索世界：`https://minecraft.luckymj.top/world.html`
  - 玩法福利：`https://minecraft.luckymj.top/play.html`
  - 新手指南：`https://minecraft.luckymj.top/guide.html`
  - 玩家公约：`https://minecraft.luckymj.top/rules.html`
  - 加入我们：`https://minecraft.luckymj.top/join.html`

### 2. 命令行连通性验证
在任意终端执行以下命令，确认返回 `HTTP/2 200`：

```bash
curl -I https://minecraft.luckymj.top/
curl -I https://minecraft.luckymj.top/guide.html
curl -I https://minecraft.luckymj.top/rules.html
```

---

## 六、 附录：历史腾讯云 Nginx 部署归档（已退役参考）

> [!NOTE]
> **说明**：以下内容为旧版在腾讯云 Ubuntu 上使用 Nginx 托管静态网页的历史方案，**现已全面由 GitHub Pages 取代，日常无需执行**，仅保留作应急技术归档。

<details>
<summary>点击展开历史腾讯云 Ubuntu Nginx 部署参考</summary>

### 历史部署路径与说明
- 旧代码目录：`~/sites/MC_web`
- 旧站点目录：`/var/www/mc.luckymj.top`
- 旧配置：Nginx 80/443 反向映射（因未取得工信部备案，已被腾讯云网关阻断）。

### 如需彻底停用腾讯云 Nginx 的 Web 站点释放资源（可选）：
```bash
# 停止或禁用 default 站点，避免无效日志占用
sudo systemctl stop nginx
sudo systemctl disable nginx
```
*(注意：关闭 Nginx 完全不影响 Minecraft 游戏服务 `/opt/mc_server/` 的运行)*
</details>
