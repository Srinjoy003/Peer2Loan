import React from "react";
import { Group } from "../types";
import {
	Select,
	SelectTrigger,
	SelectValue,
	SelectContent,
	SelectItem,
} from "./ui/select";

interface GroupDropdownProps {
	groups: Group[];
	selectedGroupId: string;
	onSelectGroup: (groupId: string) => void;
}

export function GroupDropdown({
	groups,
	selectedGroupId,
	onSelectGroup,
}: GroupDropdownProps) {
	return (
		<Select value={selectedGroupId || undefined} onValueChange={onSelectGroup}>
			<SelectTrigger className="w-[250px]">
				<SelectValue placeholder="Select Group" />
			</SelectTrigger>
			<SelectContent>
				{groups.map((group, idx) => (
					<SelectItem
						key={group.id || (group as any)._id || idx}
						value={group.id || (group as any)._id}
					>
						{group.name}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}
