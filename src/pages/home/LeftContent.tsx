import { Button, Flex, Space, Table, Tooltip, message } from "antd";
import {
  ClearOutlined,
  CloudUploadOutlined,
  DownloadOutlined,
  EditOutlined,
  FolderAddOutlined,
  PlusOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { blobToBase64, uploadFileToGithub } from "@/services/github";
import {
  createDownload,
  getFilesFromHandle,
  getOutputFileName,
  getUniqNameOnNames,
} from "@/functions";
import { useCallback, useEffect, useRef, useState } from "react";

import { BatchRenameDialog } from "@/components/BatchRenameDialog";
import { FolderSelect } from "@/components/FolderSelect";
import { ImageInput } from "@/components/ImageInput";
import { ProgressHint } from "@/components/ProgressHint";
import { TokenDialog } from "@/components/TokenDialog";
import { createImageList } from "@/engines/transform";
import { goto } from "@/router";
import { gstate } from "@/global";
import { homeState } from "@/states/home";
import { observer } from "mobx-react-lite";
import { sharpCompress } from "@/services/sharpClient";
import style from "./index.module.scss";
import { uploadState } from "@/states/upload";
import { useColumn } from "./useColumn";
import { useResponse } from "@/media";

export const LeftContent = observer(() => {
  const { isMobile } = useResponse();
  const disabled = homeState.hasTaskRunning();
  const fileRef = useRef<HTMLInputElement>(null);
  const columns = useColumn(disabled);

  const scrollBoxRef = useRef<HTMLDivElement>(null);
  const [scrollHeight, setScrollHeight] = useState<number>(0);
  const resize = useCallback(() => {
    const element = scrollBoxRef.current;
    if (element) {
      const boxHeight = element.getBoundingClientRect().height;
      const th = document.querySelector(".ant-table-thead");
      const tbody = document.querySelector(".ant-table-tbody");
      const thHeight = th?.getBoundingClientRect().height ?? 0;
      const tbodyHeight = tbody?.getBoundingClientRect().height ?? 0;
      if (boxHeight > thHeight + tbodyHeight) {
        setScrollHeight(0);
      } else {
        setScrollHeight(boxHeight - thHeight);
      }
    }
  }, []);

  /* eslint-disable react-hooks/exhaustive-deps */
  // Everytime list change, recalc the scroll height
  useEffect(resize, [homeState.list.size]);

  useEffect(() => {
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
    };
  }, [resize]);

  return (
    <Flex align="stretch" vertical className={style.content}>
      <Flex align="center" justify="space-between" className={style.menu}>
        <Space>
          <Button
            disabled={disabled}
            icon={<PlusOutlined />}
            type="primary"
            onClick={() => {
              fileRef.current?.click();
            }}
          >
            {!isMobile && gstate.locale?.listAction.batchAppend}
          </Button>
          {window.showDirectoryPicker && (
            <Button
              disabled={disabled}
              icon={<FolderAddOutlined />}
              type="primary"
              onClick={async () => {
                const handle = await window.showDirectoryPicker!();
                const result = await getFilesFromHandle(handle);
                await createImageList(result);
              }}
            >
              {!isMobile && gstate.locale?.listAction.addFolder}
            </Button>
          )}
        </Space>
        <Space>
          <FolderSelect />
          <BatchRenameDialog />

          {/* <TokenInput /> */}
          <Tooltip title={gstate.locale?.listAction.reCompress}>
            <Button
              disabled={disabled}
              icon={<ReloadOutlined />}
              onClick={async () => {
                homeState.reCompress();
              }}
            />
          </Tooltip>
          {/* <Tooltip title="使用 Sharp 压缩">
            <Button
              disabled={disabled}
              onClick={async () => {
                try {
                  gstate.loading = true;
                  for (const [key, info] of homeState.list) {
                    const output = await sharpCompress(info, homeState.option);
                    const updated = { ...info, compress: output };
                    homeState.list.set(key, updated);
                  }
                  message.success("Sharp 压缩完成");
                } catch (e: any) {
                  console.error(e);
                  message.error(e?.message || "Sharp 压缩失败");
                } finally {
                  gstate.loading = false;
                }
              }}
            >
              {!isMobile && "Sharp"}
            </Button>
          </Tooltip> */}
          <Button
            disabled={disabled}
            icon={<ClearOutlined />}
            onClick={() => {
              homeState.clear();
            }}
          >
            {!isMobile && gstate.locale?.listAction.clear}
          </Button>
          <Tooltip title="重命名">
            <Button disabled={disabled} icon={<EditOutlined />}>
              {!isMobile && "重命名"}
            </Button>
          </Tooltip>
          <Button
            icon={<DownloadOutlined />}
            type="primary"
            disabled={disabled}
            onClick={async () => {
              gstate.loading = true;
              const jszip = await import("jszip");
              const zip = new jszip.default();
              const names: Set<string> = new Set();
              /* eslint-disable @typescript-eslint/no-unused-vars */
              for (const [_, info] of homeState.list) {
                const fileName = getOutputFileName(info, homeState.option);
                const uniqName = getUniqNameOnNames(names, fileName);
                names.add(uniqName);
                if (info.compress?.blob) {
                  zip.file(uniqName, info.compress.blob);
                }
              }
              const result = await zip.generateAsync({
                type: "blob",
                compression: "DEFLATE",
                compressionOptions: {
                  level: 6,
                },
              });
              createDownload("picsmaller.zip", result);
              gstate.loading = false;
            }}
          >
            {!isMobile && gstate.locale?.listAction.downloadAll}
          </Button>
          <TokenDialog />
          <Tooltip title="上传到GitHub">
            <Button
              icon={<CloudUploadOutlined />}
              type="default"
              disabled={disabled}
              onClick={async () => {
                try {
                  const token = gstate.githubToken || "";
                  const folder = gstate.githubFolder || "";
                  if (!token) {
                    message.warning("请先在输入框填写 GitHub Token");
                    return;
                  }
                  if (!folder) {
                    message.warning("请先选择或新增上传文件夹");
                    return;
                  }
                  gstate.githubToken = token;
                  gstate.loading = true;
                  const owner = gstate.githubOwner;
                  const repo = gstate.githubRepo;
                  const branch = "main";
                  const names: Set<string> = new Set();
                  for (const [_, info] of homeState.list) {
                    if (!info.compress?.blob) continue;
                    const fileName = getOutputFileName(info, homeState.option);
                    const uniqName = getUniqNameOnNames(names, fileName);
                    names.add(uniqName);
                    const path =
                      (folder ? folder.replace(/^\/+|\/+$/g, "") + "/" : "") +
                      uniqName;
                    const contentBase64 = await blobToBase64(
                      info.compress.blob,
                    );
                    const res = await uploadFileToGithub({
                      owner,
                      repo,
                      branch,
                      path,
                      token,
                      contentBase64,
                      message: `upload ${uniqName}`,
                    });
                    uploadState.add({
                      name: uniqName,
                      path,
                      webUrl: res.webUrl,
                      rawUrl: res.rawUrl,
                      sha: res.sha,
                      size: info.compress.blob.size,
                      time: Date.now(),
                    });
                  }
                  message.success("上传完成");
                  goto("/uploads");
                } catch (err: any) {
                  console.error(err);
                  message.error(err?.message || "上传失败");
                } finally {
                  gstate.loading = false;
                }
              }}
            />
          </Tooltip>
        </Space>
        <ImageInput ref={fileRef} />
      </Flex>
      <div ref={scrollBoxRef}>
        <Table
          columns={columns}
          size="small"
          pagination={false}
          scroll={scrollHeight ? { y: scrollHeight } : undefined}
          dataSource={Array.from(homeState.list.values())}
        />
      </div>
      <Flex align="center">
        <ProgressHint />
      </Flex>
    </Flex>
  );
});
