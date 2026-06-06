import { Button, Flex, Space, Table, Tooltip } from "antd";
import {
  ClearOutlined,
  DownloadOutlined,
  FolderAddOutlined,
  PlusOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
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
import { UploadCard } from "@/components/UploadCard";
import { UrlInputDialog } from "@/components/UrlInputDialog";
import { createImageList } from "@/engines/transform";
import { gstate } from "@/global";
import { homeState } from "@/states/home";
import { observer } from "mobx-react-lite";
// import { sharpCompress } from "@/services/sharpClient";
import style from "./index.module.scss";
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
          <UrlInputDialog />
        </Space>
        <Space>
          {/* 选择文件夹 */}
          <FolderSelect />
          {/* 重命名 */}
          <BatchRenameDialog />

          {/* <TokenInput /> */}
          {/* 压缩 */}
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
          {/* 清理所有 */}
          <Button
            disabled={disabled}
            icon={<ClearOutlined />}
            onClick={() => {
              homeState.clear();
            }}
          >
            {!isMobile && gstate.locale?.listAction.clear}
          </Button>
          {/* save all */}
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
        </Space>
        <ImageInput ref={fileRef} />
      </Flex>
      {homeState.list.size === 0 ? (
        <UploadCard />
      ) : (
        <>
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
        </>
      )}
    </Flex>
  );
});
