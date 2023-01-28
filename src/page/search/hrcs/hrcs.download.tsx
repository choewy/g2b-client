import { hrcsSearchStore } from '@/store';
import {
  Alert,
  Box,
  Checkbox,
  FormControlLabel,
  FormGroup,
} from '@mui/material';
import {
  FC,
  Fragment,
  SyntheticEvent,
  useCallback,
  useEffect,
  useState,
} from 'react';
import csvDownload from 'json-to-csv-export';
import { exportToExcel } from 'react-json-to-excel';
import { createFileName } from '../helpers';
import { HrcsDownloadProps } from './types';

export const HrcsDownload: FC<HrcsDownloadProps> = ({ rows }) => {
  const resetRows = hrcsSearchStore.useResetRows();

  const [download, setDownload] = useState<{ csv: boolean; excel: boolean }>({
    csv: false,
    excel: true,
  });

  useEffect(() => {
    if (!rows || rows.length < 1) {
      return;
    }

    if (download.excel) {
      exportToExcel(
        [{ sheetName: '사전규격', details: rows }],
        createFileName('사전규격', 'xlsx'),
        true,
      );
    }

    if (download.csv) {
      csvDownload({
        data: rows,
        filename: createFileName('사전규격', 'csv'),
        delimiter: ',',
      });
    }

    if (rows) {
      return () => {
        resetRows();
      };
    }
  }, [rows, download, resetRows]);

  const downloadLabel = useCallback((key: string) => {
    switch (key) {
      case 'csv':
        return 'CSV 다운로드';

      case 'excel':
        return 'Excel 다운로드';
    }
  }, []);

  const onChangeEvent = useCallback(
    (key: string) => (_: SyntheticEvent<Element, Event>, checked: boolean) => {
      setDownload((prev) => ({ ...prev, [key]: checked }));
    },
    [setDownload],
  );

  return (
    <Fragment>
      <FormGroup
        sx={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 1,
        }}
      >
        {Object.entries(download).map(([key, value]) => (
          <FormControlLabel
            key={`hrcs-download-${key}`}
            control={<Checkbox size="small" />}
            label={downloadLabel(key)}
            value={key}
            checked={value}
            onChange={onChangeEvent(key)}
            componentsProps={{
              typography: { fontSize: 13 },
            }}
          />
        ))}
      </FormGroup>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Alert
          severity="warning"
          sx={{
            alignItems: 'center',
            justifyContent: 'center',
            width: 500,
          }}
        >
          Windows에서는 CSV 파일이 정상적으로 보이지 않을 수 있습니다.
        </Alert>
      </Box>
    </Fragment>
  );
};