import { Button, Checkbox, Divider, Input, Modal, Popconfirm, Select, Space, message } from "antd";

import { gstate } from "@/global";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { blobToBase64, uploadFileToGithub } from "@/services/github";
import { getOutputFileName, getUniqNameOnNames } from "@/functions";
import { homeState } from "@/states/home";
import { uploadState } from "@/states/upload";
import { goto } from "@/router";

export const TokenDialog = observer(() => {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [folderName, setFolderName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [useCompressed, setUseCompressed] = useState(true);

  const token = gstate.githubToken || "";
  const folder = gstate.githubFolder || "";
  const currentToken = value || token;

  const onOpen = () => {
    setValue("");
    setOpen(true);
  };

  const onSaveToken = () => {
    const v = value.trim();
    if (!v) {
      message.warning("请输入 GitHub Token");
      return;
    }
    gstate.githubToken = v;
    message.success("Token 已更新");
  };

  const onClearToken = () => {
    gstate.githubToken = "";
    setValue("");
    message.success("Token 已清空");
  };

  const onUpload = async () => {
    if (!currentToken) {
      message.warning("请先输入 GitHub Token");
      return;
    }
    if (!folder) {
      message.warning("请先选择上传文件夹");
      return;
    }

    try {
      setUploading(true);
      if (value.trim()) {
        gstate.githubToken = value.trim();
      }

      const owner = gstate.githubOwner;
      const repo = gstate.githubRepo;
      const branch = "main";
      const names: Set<string> = new Set();

      for (const [_, info] of homeState.list) {
        const blob = useCompressed ? info.compress?.blob : info.blob;
        if (!blob) continue;
        const fileName = getOutputFileName(info, homeState.option);
        const uniqName = getUniqNameOnNames(names, fileName);
        names.add(uniqName);
        const path =
          (folder.replace(/^\/+|\/+$/g, "") + "/") + uniqName;
        const contentBase64 = await blobToBase64(blob);
        const res = await uploadFileToGithub({
          owner,
          repo,
          branch,
          path,
          token: currentToken,
          contentBase64,
          message: `upload ${uniqName}`,
        });
        uploadState.add({
          name: uniqName,
          path,
          webUrl: res.webUrl,
          rawUrl: res.rawUrl,
          gitUrl: res.gitUrl,
          sha: res.sha,
          size: blob.size,
          time: Date.now(),
        });
      }
      message.success("上传完成");
      goto("/uploads");
      setOpen(false);
    } catch (err: any) {
      console.error(err);
      message.error(err?.message || "上传失败");
    } finally {
      setUploading(false);
    }
  };

  const options = gstate.githubFolderOptions.map((v) => ({
    label: v,
    value: v,
  }));

  return (
    <>
      <Space>
        <Button onClick={onOpen}>
          {token ? "提交" : "设置 Token"}
        </Button>
        <Popconfirm
          title="确定移除列表中的所有图片？"
          onConfirm={() => {
            homeState.clear();
            message.success("已移除所有图片");
          }}
          okText="确定"
          cancelText="取消"
        >
          <Button danger>移除所有图片</Button>
        </Popconfirm>
      </Space>
      <Modal
        title="GitHub 设置与上传"
        open={open}
        onCancel={() => setOpen(false)}
        footer={
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Button type="link" danger onClick={onClearToken} disabled={!token}>
              清空 Token
            </Button>
            <Space>
              <Button onClick={() => setOpen(false)}>取消</Button>
              <Button onClick={onSaveToken} disabled={uploading}>
                保存 Token
              </Button>
              <Button
                type="primary"
                onClick={onUpload}
                loading={uploading}
                disabled={!currentToken || !folder}
              >
                确认上传
              </Button>
            </Space>
          </div>
        }
      >
        <Space direction="vertical" style={{ width: "100%" }}>
          <Input.Password
            placeholder={token ? "输入新 Token（可选）" : "请输入 GitHub Token"}
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          <Select
            style={{ width: "100%" }}
            placeholder="选择或新增上传文件夹"
            value={gstate.githubFolder || undefined}
            options={options}
            onChange={(val) => {
              gstate.githubFolder = String(val || "");
            }}
            dropdownRender={(menu) => (
              <div>
                {menu}
                <Divider style={{ margin: "8px 0" }} />
                <Space style={{ padding: "0 8px 4px" }}>
                  <Input
                    placeholder="自定义文件夹名"
                    value={folderName}
                    onChange={(e) => setFolderName(e.target.value)}
                    onPressEnter={() => {
                      const v = folderName.trim();
                      if (!v) return;
                      if (!gstate.githubFolderOptions.includes(v)) {
                        gstate.githubFolderOptions = [
                          ...gstate.githubFolderOptions,
                          v,
                        ];
                      }
                      gstate.githubFolder = v;
                      setFolderName("");
                    }}
                  />
                  <Button
                    type="link"
                    onClick={() => {
                      const v = folderName.trim();
                      if (!v) return;
                      if (!gstate.githubFolderOptions.includes(v)) {
                        gstate.githubFolderOptions = [
                          ...gstate.githubFolderOptions,
                          v,
                        ];
                      }
                      gstate.githubFolder = v;
                      setFolderName("");
                    }}
                  >
                    新增
                  </Button>
                </Space>
              </div>
            )}
          />
          <Checkbox
            checked={useCompressed}
            onChange={(e) => setUseCompressed(e.target.checked)}
          >
            使用压缩后的图片上传
          </Checkbox>
        </Space>
      </Modal>
    </>
  );
});
