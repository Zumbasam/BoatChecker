import {
  Box, Heading, Text, HStack, RadioGroup,
  Radio, IconButton, useToast, Textarea
} from '@chakra-ui/react';
import { Camera, Check } from 'lucide-react';
import { useState } from 'react';
import { db } from '../db';
import type { CheckItemState } from '../db';

interface Props {
  item: {
    id: string;
    label: string;
    desc: string;
    cost: { ok: number; obs: number; kritisk: number };
  };
}

export const ChecklistCard = ({ item }: Props) => {
  const [value, setValue] = useState<'ok' | 'obs' | 'kritisk' | ''>('');
  const [note, setNote] = useState('');
  const toast = useToast();

  const save = async (state: 'ok' | 'obs' | 'kritisk') => {
    setValue(state);
    const rec: CheckItemState = { id: item.id, state, note };
    await db.items.put(rec);
    toast({ title: `Lagret som ${state}`, status: 'success', duration: 1000 });
  };

  return (
    <Box p={4} borderWidth="1px" rounded="xl" shadow="sm" mb={4}>
      <Heading size="sm">{item.label}</Heading>
      <Text fontSize="sm" mb={2}>{item.desc}</Text>

      <RadioGroup onChange={save} value={value}>
        <HStack spacing={4}>
          <Radio value="ok">OK</Radio>
          <Radio value="obs">Obs</Radio>
          <Radio value="kritisk">Kritisk</Radio>
        </HStack>
      </RadioGroup>

      <Textarea
        mt={2}
        placeholder="Notat …"
        size="sm"
        value={note}
        onChange={e => setNote(e.target.value)}
        onBlur={() => db.items.update(item.id, { note })}
      />

      <HStack mt={2}>
        <IconButton
          aria-label="Legg til bilde"
          icon={<Camera size={18} />}
          size="sm"
          onClick={async () => {
            const file = await selectImage();
            if (!file) return;
            const dataUrl = await fileToDataURL(file);
            await db.items.update(item.id, { photo: dataUrl });
            toast({ title: 'Bilde lagret', status: 'success', duration: 800 });
          }}
        />
        {value && (
          <IconButton
            aria-label="Lagret"
            icon={<Check size={18} />}
            size="sm"
            isDisabled
          />
        )}
      </HStack>
    </Box>
  );
};

// hjelpefunksjoner
const selectImage = (): Promise<File | null> =>
  new Promise(res => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => res(input.files ? input.files[0] : null);
    input.click();
  });

const fileToDataURL = (file: File): Promise<string> =>
  new Promise(res => {
    const reader = new FileReader();
    reader.onload = e => res(e.target!.result as string);
    reader.readAsDataURL(file);
  });
