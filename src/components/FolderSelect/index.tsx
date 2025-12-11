import { Button, Divider, Input, Select, Space, Typography } from "antd";

import { gstate } from "@/global";
import { observer } from "mobx-react-lite";
import { useState } from "react";

export const FolderSelect = observer(() => {
  const [name, setName] = useState("");
  const options = gstate.githubFolderOptions.map((v) => ({
    label: v,
    value: v,
  }));
  return (
    <Space>
      <Typography.Text type="secondary">文件夹</Typography.Text>
      <Select
        style={{ minWidth: 180 }}
        placeholder="选择或新增"
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
                value={name}
                onChange={(e) => setName(e.target.value)}
                onPressEnter={() => {
                  const v = name.trim();
                  if (!v) return;
                  if (!gstate.githubFolderOptions.includes(v)) {
                    gstate.githubFolderOptions = [
                      ...gstate.githubFolderOptions,
                      v,
                    ];
                  }
                  gstate.githubFolder = v;
                  setName("");
                }}
              />
              <Button
                type="link"
                onClick={() => {
                  const v = name.trim();
                  if (!v) return;
                  if (!gstate.githubFolderOptions.includes(v)) {
                    gstate.githubFolderOptions = [
                      ...gstate.githubFolderOptions,
                      v,
                    ];
                  }
                  gstate.githubFolder = v;
                  setName("");
                }}
              >
                新增
              </Button>
            </Space>
          </div>
        )}
      />
    </Space>
  );
});
