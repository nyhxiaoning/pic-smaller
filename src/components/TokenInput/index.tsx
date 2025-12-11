import { Button, Input, Space, Typography } from "antd";

import { gstate } from "@/global";
import { observer } from "mobx-react-lite";

export const TokenInput = observer(() => {
  return (
    <Space>
      <Typography.Text type="secondary">GitHub Token</Typography.Text>
      <Input.Password
        style={{ minWidth: 240 }}
        placeholder="请输入 GitHub Token111"
        value={gstate.githubToken}
        onChange={(e) => {
          gstate.githubToken = e.target.value;
        }}
      />
      <Button
        type="link"
        onClick={() => {
          gstate.githubToken = "";
        }}
      >
        清空
      </Button>
    </Space>
  );
});
