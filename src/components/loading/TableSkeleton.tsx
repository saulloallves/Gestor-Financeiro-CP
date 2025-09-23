import { 
  Box, 
  Skeleton, 
  Card, 
  CardContent,
  Typography 
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
  showActions?: boolean;
  title?: string;
}

export function TableSkeleton({ 
  rows = 5, 
  columns = 4, 
  showHeader = true,
  showActions = true,
  title 
}: TableSkeletonProps) {
  const theme = useTheme();

  return (
    <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
      {title && (
        <CardContent sx={{ pb: 1 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {title}
          </Typography>
        </CardContent>
      )}
      
      <Box sx={{ p: 2 }}>
        {/* Header da tabela */}
        {showHeader && (
          <Box 
            sx={{ 
              display: 'flex', 
              gap: 2, 
              mb: 2,
              pb: 1,
              borderBottom: `1px solid ${theme.palette.divider}`
            }}
          >
            {Array.from({ length: columns }).map((_, index) => (
              <Skeleton
                key={`header-${index}`}
                variant="text"
                width={index === 0 ? '20%' : '15%'}
                height={24}
                sx={{ 
                  flex: index === columns - 1 && showActions ? '0 0 120px' : 1,
                  borderRadius: 1
                }}
              />
            ))}
            {showActions && (
              <Skeleton
                variant="text"
                width="80px"
                height={24}
                sx={{ borderRadius: 1 }}
              />
            )}
          </Box>
        )}

        {/* Linhas da tabela */}
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <Box
            key={`row-${rowIndex}`}
            sx={{
              display: 'flex',
              gap: 2,
              mb: 2,
              alignItems: 'center',
              p: 1.5,
              borderRadius: 2,
              backgroundColor: rowIndex % 2 === 0 
                ? 'transparent' 
                : theme.palette.grey[50],
            }}
          >
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton
                key={`cell-${rowIndex}-${colIndex}`}
                variant="text"
                width={
                  colIndex === 0 ? '25%' :
                  colIndex === 1 ? '30%' :
                  colIndex === 2 ? '20%' : '15%'
                }
                height={20}
                sx={{ 
                  flex: colIndex === columns - 1 && showActions ? '0 0 120px' : 1,
                  borderRadius: 1
                }}
              />
            ))}
            
            {/* Ações */}
            {showActions && (
              <Box sx={{ display: 'flex', gap: 1, flex: '0 0 120px' }}>
                <Skeleton
                  variant="rectangular"
                  width={32}
                  height={32}
                  sx={{ borderRadius: 1 }}
                />
                <Skeleton
                  variant="rectangular"
                  width={32}
                  height={32}
                  sx={{ borderRadius: 1 }}
                />
                <Skeleton
                  variant="rectangular"
                  width={32}
                  height={32}
                  sx={{ borderRadius: 1 }}
                />
              </Box>
            )}
          </Box>
        ))}
      </Box>
    </Card>
  );
}

interface StatCardSkeletonProps {
  count?: number;
}

export function StatCardSkeleton({ count = 4 }: StatCardSkeletonProps) {
  return (
    <Box sx={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
      gap: 2,
      mb: 3
    }}>
      {Array.from({ length: count }).map((_, index) => (
        <Card key={`stat-${index}`} sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Skeleton
                variant="circular"
                width={48}
                height={48}
              />
              
              <Box sx={{ flex: 1 }}>
                <Skeleton
                  variant="text"
                  width="60%"
                  height={16}
                  sx={{ mb: 1 }}
                />
                <Skeleton
                  variant="text"
                  width="40%"
                  height={28}
                />
              </Box>
            </Box>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}

interface PageSkeletonProps {
  showStats?: boolean;
  showFilters?: boolean;
  title?: string;
  tableProps?: Partial<TableSkeletonProps>;
}

export function PageSkeleton({ 
  showStats = true, 
  showFilters = true,
  title = 'Carregando...',
  tableProps = {}
}: PageSkeletonProps) {
  return (
    <Box sx={{ p: 3 }}>
      {/* Header da página */}
      <Box sx={{ mb: 3 }}>
        <Skeleton
          variant="text"
          width="200px"
          height={40}
          sx={{ mb: 1 }}
        />
        <Skeleton
          variant="text"
          width="300px"
          height={20}
        />
      </Box>

      {/* Cards de estatísticas */}
      {showStats && <StatCardSkeleton />}

      {/* Filtros */}
      {showFilters && (
        <Card sx={{ borderRadius: 3, mb: 3 }}>
          <CardContent>
            <Box sx={{ 
              display: 'flex', 
              gap: 2, 
              alignItems: 'center',
              flexWrap: 'wrap'
            }}>
              <Skeleton
                variant="rectangular"
                width={200}
                height={40}
                sx={{ borderRadius: 2 }}
              />
              <Skeleton
                variant="rectangular"
                width={150}
                height={40}
                sx={{ borderRadius: 2 }}
              />
              <Skeleton
                variant="rectangular"
                width={150}
                height={40}
                sx={{ borderRadius: 2 }}
              />
              <Skeleton
                variant="rectangular"
                width={100}
                height={40}
                sx={{ borderRadius: 2 }}
              />
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Tabela principal */}
      <TableSkeleton title={title} {...tableProps} />
    </Box>
  );
}