# LuckyMC 官网部署与更新

本项目是原生 HTML、CSS、JavaScript 静态网站，不需要 Node.js、npm、构建或 dist。以下服务器命令在腾讯云 Ubuntu 的 SSH 终端执行，不能在本地 PowerShell 执行。

## 已确认的部署结构

| 项目 | 配置 |
| --- | --- |
| 官网 | https://mc.luckymj.top/ |
| GitHub | https://github.com/luckymj13/MC_web.git |
| 分支 | main |
| 服务器代码目录 | ~/sites/MC_web（ubuntu 用户通常为 /home/ubuntu/sites/MC_web） |
| Nginx 网站目录 | /var/www/mc.luckymj.top |
| 当前启用的站点配置 | /etc/nginx/sites-enabled/default |
| HTTPS 证书目录 | /etc/letsencrypt/live/mc.luckymj.top/ |
| 游戏服务目录 | /opt/mc_server/，网站更新不操作此目录 |

Nginx 根据 server_name 匹配域名，通过 root /var/www/mc.luckymj.top 读取网页。旧目录 /var/www/html 保留作历史备份。网站更新无需重启 Minecraft 服务。

## 日常更新：本地推送之后执行

先确保本地修改已经提交并成功推送到 GitHub 的 main 分支。然后用 ubuntu 用户登录服务器，将下面整个代码块复制到 Bash 执行。

脚本先快进拉取，再准备静态文件、备份现有网站，最后覆盖网站目录。使用子 Shell，出错会停止本次更新，不会退出 SSH 登录。每次执行会生成独立备份。

```bash
(
    set -euo pipefail

    repo="$HOME/sites/MC_web"
    web_root=/var/www/mc.luckymj.top

    test -d "$repo/.git"
    test -f "$web_root/index.html"
    test "$(git -C "$repo" branch --show-current)" = main
    if [ -n "$(git -C "$repo" status --porcelain)" ]; then
        echo '服务器代码目录存在本地改动，请先检查，更新已停止。' >&2
        exit 1
    fi

    git -C "$repo" pull --ff-only origin main
    revision=$(git -C "$repo" rev-parse --short HEAD)
    stage=$(mktemp -d /tmp/luckymc-stage.XXXXXXXX)
    trap 'rm -rf -- "$stage"' EXIT

    # 仅导出网页资源，不将 .git、部署文档等放进公开网站目录。
    git -C "$repo" archive HEAD -- \
        index.html world.html play.html guide.html rules.html join.html style.css script.js picture \
        | tar -x -C "$stage"

    for page in index.html world.html play.html guide.html rules.html join.html; do
        test -s "$stage/$page"
    done
    test -s "$stage/style.css"
    test -s "$stage/script.js"
    test -d "$stage/picture"

    sudo -v
    sudo mkdir -p /var/backups/luckymc
    backup=$(sudo mktemp -d /var/backups/luckymc/backup-XXXXXXXX)
    sudo tar -czf "$backup/site.tar.gz" -C "$web_root" .

    sudo cp -R "$stage/." "$web_root/"
    sudo find "$web_root" -type d -exec chmod 755 {} +
    sudo find "$web_root" -type f -exec chmod 644 {} +

    echo "已部署提交：$revision"
    echo "本次回退备份：$backup/site.tar.gz"
)
```

任何命令报错时，先处理错误，不要跳过继续执行。首次使用时若代码目录不存在，先执行：

```bash
mkdir -p ~/sites
git clone https://github.com/luckymj13/MC_web.git ~/sites/MC_web
```

私有仓库需要服务器具有读取权限；不要把令牌写进命令、仓库或文档。

### 更新范围与限制

- 只更新 HTML、CSS、JS、图片时，无需重新加载 Nginx，也无需重新申请证书。
- 此方案使用覆盖复制，不会删除线上旧文件。若以后删除或重命名页面、图片，先确认准确路径再单独清理旧文件；不要对网站目录笼统执行递归删除。
- 若以后新增顶层页面或资源目录，需要把它加入脚本的 git archive 文件列表。
- 复制过程不是原子切换，期间可能短暂出现新旧资源混用，适用于目前小型展示站。
- 不要直接在线上修改页面；统一在本地修改、提交推送，再运行更新脚本。
- 备份会累积，可定期检查 /var/backups/luckymc 的占用，确认不再需要后再清理指定备份。

## 更新后验证

在服务器执行，确认均返回 HTTP 200：

```bash
curl -I https://mc.luckymj.top/
curl -I https://mc.luckymj.top/world.html
curl -I https://mc.luckymj.top/play.html
curl -I https://mc.luckymj.top/guide.html
curl -I https://mc.luckymj.top/rules.html
curl -I https://mc.luckymj.top/join.html
curl -I https://mc.luckymj.top/style.css
```

浏览器打开官网，按 Ctrl + F5 强制刷新，检查导航、图片加载与放大、复制地址、FAQ 展开以及手机菜单。加入页应显示 Minecraft Java 26.1.2。HTTP 200 只能验证资源可访问，不能代替交互检查。

若显示旧页面，先检查浏览器缓存和 Nginx 实际 root；若用了 CDN，还需刷新相关 CDN 缓存。

```bash
git -C ~/sites/MC_web log -1 --oneline
sudo nginx -T 2>&1 | less
```

在 less 中搜索 /mc.luckymj.top，按 q 退出。

## 回退到更新前

更新脚本会输出本次备份的完整路径。把下面占位路径替换为该路径，然后执行：

```bash
backup_file=/var/backups/luckymc/backup-替换为实际编号/site.tar.gz
sudo test -f "$backup_file" && \
sudo tar -xzf "$backup_file" -C /var/www/mc.luckymj.top
```

这会恢复备份中的文件，不会删除新版本额外增加的文件；额外文件需要按准确路径另行处理。回退网站文件不会改变服务器 Git 检出的提交；在 GitHub 修复之前不要再次运行更新脚本，否则会重新部署新版本。恢复后再次验证页面。

## 修改 Nginx 配置时

日常文件更新不需要操作配置。只有修改域名、网站目录或 HTTPS 设置时才需要以下流程：

```bash
site_config=$(readlink -f /etc/nginx/sites-enabled/default)
sudo mkdir -p /etc/nginx-backups
sudo cp -a "$site_config" "/etc/nginx-backups/default-$(date +%Y%m%d-%H%M%S).conf"
sudo nano "$site_config"
sudo nginx -t && sudo systemctl reload nginx
```

保留现有 Certbot 证书及 HTTP 跳转配置；不要改动 /etc/nginx/conf.d/github-webhook.conf。配置备份应放在 /etc/nginx-backups，避免被 Nginx 重复加载。nginx -t 报错时不要重启服务。

未来新增子域名时，每个站点使用独立的 /var/www/域名 目录和 Nginx server 配置，以不同的 server_name 匹配；多个子域名可指向同一服务器 IP。
