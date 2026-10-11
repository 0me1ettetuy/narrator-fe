import { Languages, Moon, Settings, Sun } from 'lucide-react';
import { useTheme } from '@/shared/theme';
import { Button } from '@/shared/ui/button';
import { ButtonGroup } from '@/shared/ui/button-group';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';

export function SidebarSettings() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <>
      <ButtonGroup className="mt-2 w-full border-t pt-2 [&>[data-slot=button]]:rounded-none! [&>[data-slot=button]:first-child]:rounded-l-md! [&>[data-slot=button]:last-child]:rounded-r-md! group-data-[collapsible=icon]:hidden">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={toggleTheme}
          aria-label="Toggle dark mode"
        >
          {isDark ? <Moon /> : <Sun />}
          <span>{isDark ? 'Dark' : 'Light'}</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          disabled
          aria-label="Language selection is not available yet"
        >
          <Languages />
          <span>EN / RU</span>
        </Button>
      </ButtonGroup>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="outline"
              size="icon-sm"
              className="mt-2 hidden self-center group-data-[collapsible=icon]:inline-flex"
              aria-label="Open settings"
            >
              <Settings />
            </Button>
          }
        />
        <DropdownMenuContent side="right" align="end" className="w-40">
          <DropdownMenuItem onClick={toggleTheme}>
            {isDark ? <Moon /> : <Sun />}
            <span>Theme</span>
            <span className="ml-auto text-xs text-muted-foreground">
              {isDark ? 'Dark' : 'Light'}
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem disabled>
            <Languages />
            <span>Language</span>
            <span className="ml-auto text-xs text-muted-foreground">
              EN / RU
            </span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
