import { useState, useRef } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  Box,
  Text,
  VStack,
  HStack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Input,
  Alert,
  AlertIcon,
  Badge
} from '@chakra-ui/react';
import { useTranslation } from 'next-i18next';
import MyIcon from '@fastgpt/web/components/common/Icon';
import { useRequest } from '@fastgpt/web/hooks/useRequest';
import { postBatchImportMembers, type BatchImportMemberItem } from '@/web/support/user/team/api';
import { useToast } from '@fastgpt/web/hooks/useToast';

type ImportMembersModalProps = {
  onClose: () => void;
  onSuccess: () => void;
};

/**
 * [Privatization] Modal for batch importing members via CSV/Excel
 * Expected CSV format: username,password,role,memberName
 * - username: required
 * - password: required
 * - role: optional (owner/admin/member), defaults to member
 * - memberName: optional, defaults to username
 */
function ImportMembersModal({ onClose, onSuccess }: ImportMembersModalProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [members, setMembers] = useState<BatchImportMemberItem[]>([]);
  const [parseError, setParseError] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setParseError('');
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').filter((line) => line.trim());

        // Skip header if present
        const startIndex = lines[0]?.toLowerCase().includes('username') ? 1 : 0;

        const parsed: BatchImportMemberItem[] = [];
        for (let i = startIndex; i < lines.length; i++) {
          const cols = lines[i].split(',').map((c) => c.trim());
          if (cols.length >= 2 && cols[0] && cols[1]) {
            parsed.push({
              username: cols[0],
              password: cols[1],
              role: (['owner', 'admin', 'member'].includes(cols[2]) ? cols[2] : 'member') as any,
              memberName: cols[3] || cols[0]
            });
          }
        }

        if (parsed.length === 0) {
          setParseError('No valid rows found. Format: username,password,role,memberName');
        } else {
          setMembers(parsed);
        }
      } catch (err: any) {
        setParseError(`Parse error: ${err.message}`);
      }
    };

    reader.onerror = () => {
      setParseError('Failed to read file');
    };

    reader.readAsText(file);
  };

  const { runAsync: onImport, loading } = useRequest(
    async () => {
      return postBatchImportMembers(members);
    },
    {
      onSuccess(result) {
        toast({
          title: `Import complete: ${result.success} success, ${result.failed} failed`,
          status: result.failed > 0 ? 'warning' : 'success'
        });
        if (result.success > 0) {
          onSuccess();
        }
        onClose();
      },
      errorToast: 'Import failed'
    }
  );

  return (
    <Modal isOpen onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{t('account_team:import_members') || 'Import Members'}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <Alert status="info" borderRadius="md">
              <AlertIcon />
              <Box>
                <Text fontWeight="bold">CSV Format:</Text>
                <Text fontSize="sm">username,password,role,memberName</Text>
                <Text fontSize="xs" color="gray.600">
                  Role: owner/admin/member (default: member)
                </Text>
              </Box>
            </Alert>

            <HStack>
              <Input
                type="file"
                accept=".csv,.txt"
                ref={fileInputRef}
                display="none"
                onChange={handleFileChange}
              />
              <Button
                leftIcon={<MyIcon name="common/uploadFileFill" w="16px" />}
                onClick={() => fileInputRef.current?.click()}
                variant="whitePrimary"
              >
                {t('common:Select file') || 'Select CSV File'}
              </Button>
              {members.length > 0 && (
                <Badge colorScheme="green">{members.length} members ready</Badge>
              )}
            </HStack>

            {parseError && (
              <Alert status="error" borderRadius="md">
                <AlertIcon />
                {parseError}
              </Alert>
            )}

            {members.length > 0 && (
              <TableContainer maxH="300px" overflowY="auto">
                <Table size="sm">
                  <Thead position="sticky" top={0} bg="white">
                    <Tr>
                      <Th>#</Th>
                      <Th>Username</Th>
                      <Th>Role</Th>
                      <Th>Name</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {members.map((m, i) => (
                      <Tr key={i}>
                        <Td>{i + 1}</Td>
                        <Td>{m.username}</Td>
                        <Td>
                          <Badge
                            colorScheme={
                              m.role === 'owner' ? 'red' : m.role === 'admin' ? 'orange' : 'gray'
                            }
                          >
                            {m.role}
                          </Badge>
                        </Td>
                        <Td>{m.memberName}</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </TableContainer>
            )}
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            {t('common:Cancel') || 'Cancel'}
          </Button>
          <Button
            variant="primary"
            isDisabled={members.length === 0}
            isLoading={loading}
            onClick={onImport}
          >
            {t('common:Confirm') || 'Import'} ({members.length})
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default ImportMembersModal;
